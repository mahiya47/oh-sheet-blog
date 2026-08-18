import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

const WORD_BANK = [
  { word: "APPLE", clue: "Common fruit, often red or green" },
  { word: "TIGER", clue: "Big striped cat" },
  { word: "PLANET", clue: "Earth is one" },
  { word: "GUITAR", clue: "Six-stringed instrument" },
  { word: "CASTLE", clue: "Medieval fortress" },
  { word: "PENCIL", clue: "Writing tool with graphite" },
  { word: "GARDEN", clue: "Place to grow plants" },
  { word: "WINTER", clue: "Coldest season" },
  { word: "BRIDGE", clue: "Structure crossing a river" },
  { word: "COFFEE", clue: "Morning caffeine drink" },
  { word: "ROBOT", clue: "Mechanical automaton" },
  { word: "DESERT", clue: "Sandy, dry region" },
  { word: "ISLAND", clue: "Land surrounded by water" },
  { word: "SILVER", clue: "Precious metal, symbol Ag" },
  { word: "MARKET", clue: "Place to buy goods" },
  { word: "ORANGE", clue: "Citrus fruit and a color" },
  { word: "PIRATE", clue: "Seafaring outlaw" },
  { word: "ROCKET", clue: "Vehicle that goes to space" },
  { word: "CANDLE", clue: "Wax stick with a wick" },
  { word: "JUNGLE", clue: "Dense tropical forest" },
  { word: "PUZZLE", clue: "Brain teaser, like this game" },
  { word: "WIZARD", clue: "Magic-user in fantasy tales" },
  { word: "VOLCANO", clue: "Mountain that erupts" },
  { word: "DIAMOND", clue: "Hardest natural gemstone" },
  { word: "AIRPORT", clue: "Where planes take off" },
  { word: "LIBRARY", clue: "Building full of books" },
  { word: "PAINTER", clue: "Someone who makes art with a brush" },
  { word: "MONSTER", clue: "Scary fictional creature" },
  { word: "CAPTAIN", clue: "Leader of a ship or team" },
  { word: "KITCHEN", clue: "Room where meals are cooked" },
  { word: "TORNADO", clue: "Violent spinning windstorm" },
  { word: "OCEAN", clue: "Vast body of salt water" },
  { word: "RIVER", clue: "Flowing body of fresh water" },
  { word: "CLOUD", clue: "Fluffy thing in the sky" },
  { word: "STORM", clue: "Severe weather event" },
  { word: "TRAIN", clue: "Vehicle that runs on rails" },
  { word: "PLANE", clue: "Flies through the air" },
  { word: "MOUSE", clue: "Small rodent, or a computer device" },
  { word: "HOUSE", clue: "Place where people live" },
  { word: "MUSIC", clue: "Organized sound, art form" },
  { word: "PIZZA", clue: "Italian dish with cheese and toppings" },
  { word: "CHESS", clue: "Strategy game with kings and pawns" },
  { word: "SNAKE", clue: "Legless reptile" },
  { word: "SPACE", clue: "The final frontier" },
  { word: "EARTH", clue: "Our home planet" },
  { word: "BREAD", clue: "Baked staple food" },
  { word: "LEMON", clue: "Sour yellow citrus fruit" },
  { word: "HONEY", clue: "Sweet substance made by bees" },
  { word: "MAGIC", clue: "Supernatural power" },
  { word: "NIGHT", clue: "Opposite of day" },
  { word: "LIGHT", clue: "Opposite of dark" },
  { word: "BANANA", clue: "Yellow curved fruit" },
  { word: "MANGO", clue: "Sweet tropical fruit" },
  { word: "GRAPE", clue: "Small fruit that grows in bunches" },
  { word: "CHERRY", clue: "Small red stone fruit" },
  { word: "PEACH", clue: "Fuzzy orange-pink fruit" },
  { word: "POTATO", clue: "Starchy underground vegetable" },
  { word: "TOMATO", clue: "Red fruit often used as a vegetable" },
  { word: "CARROT", clue: "Orange root vegetable" },
  { word: "ONION", clue: "Layered vegetable that makes you cry" },
  { word: "GARLIC", clue: "Pungent bulb used in cooking" },
  { word: "BUTTER", clue: "Dairy spread made from cream" },
  { word: "CHEESE", clue: "Dairy product made from milk" },
  { word: "YOGURT", clue: "Creamy fermented dairy food" },
  { word: "NOODLE", clue: "Long thin strip of pasta" },
  { word: "BURGER", clue: "Sandwich with a meat patty" },
  { word: "SALAD", clue: "Mixed dish of raw vegetables" },
  { word: "SOUP", clue: "Warm liquid dish" },
  { word: "CAKE", clue: "Sweet baked dessert" },
  { word: "COOKIE", clue: "Small sweet baked treat" },
  { word: "VANILLA", clue: "Common dessert flavoring" },
  { word: "PEPPER", clue: "Spicy seasoning" },
  { word: "SUGAR", clue: "Sweet crystalline substance" },
  { word: "ELEPHANT", clue: "Large mammal with a trunk" },
  { word: "GIRAFFE", clue: "Tallest land animal" },
  { word: "DOLPHIN", clue: "Intelligent marine mammal" },
  { word: "PENGUIN", clue: "Flightless Antarctic bird" },
  { word: "RABBIT", clue: "Long-eared hopping animal" },
  { word: "TURTLE", clue: "Slow reptile with a shell" },
  { word: "SPIDER", clue: "Eight-legged creature" },
  { word: "EAGLE", clue: "Bird of prey with sharp talons" },
  { word: "WOLF", clue: "Wild howling canine" },
  { word: "ZEBRA", clue: "Striped African animal" },
  { word: "MONKEY", clue: "Tree-climbing primate" },
  { word: "PANDA", clue: "Black and white bear" },
  { word: "KOALA", clue: "Australian tree-dwelling marsupial" },
  { word: "CAMEL", clue: "Desert animal with humps" },
  { word: "DEER", clue: "Antlered forest animal" },
  { word: "GOOSE", clue: "Large web-footed bird" },
  { word: "DUCK", clue: "Small web-footed waterbird" },
  { word: "SWAN", clue: "Elegant white water bird" },
  { word: "OWL", clue: "Nocturnal bird of prey" },
  { word: "HAWK", clue: "Sharp-eyed bird of prey" },
  { word: "LION", clue: "King of the jungle" },
  { word: "LEOPARD", clue: "Spotted big cat" },
  { word: "CHEETAH", clue: "Fastest land animal" },
  { word: "GORILLA", clue: "Large great ape" },
  { word: "KANGAROO", clue: "Hopping Australian marsupial" },
  { word: "OCTOPUS", clue: "Eight-armed sea creature" },
  { word: "LOBSTER", clue: "Clawed sea crustacean" },
  { word: "CRAB", clue: "Sideways-walking crustacean" },
  { word: "COMPUTER", clue: "Electronic device for processing data" },
  { word: "KEYBOARD", clue: "Typing input device" },
  { word: "MONITOR", clue: "Computer screen" },
  { word: "PRINTER", clue: "Device that puts ink on paper" },
  { word: "CAMERA", clue: "Device for taking photos" },
  { word: "RADIO", clue: "Device for broadcasting sound" },
  { word: "SPEAKER", clue: "Device that plays audio" },
  { word: "WALLET", clue: "Small case for money and cards" },
  { word: "UMBRELLA", clue: "Rain protection device" },
  { word: "BACKPACK", clue: "Bag worn on the shoulders" },
  { word: "SUITCASE", clue: "Case for packing clothes" },
  { word: "BLANKET", clue: "Warm bed covering" },
  { word: "PILLOW", clue: "Soft cushion for your head" },
  { word: "MIRROR", clue: "Reflective glass surface" },
  { word: "LADDER", clue: "Climbing tool with rungs" },
  { word: "HAMMER", clue: "Tool for driving nails" },
  { word: "WRENCH", clue: "Tool for turning bolts" },
  { word: "SCISSORS", clue: "Cutting tool with two blades" },
  { word: "NEEDLE", clue: "Thin sewing tool" },
  { word: "THREAD", clue: "Thin strand used in sewing" },
  { word: "BUTTON", clue: "Small fastener on clothing" },
  { word: "ZIPPER", clue: "Sliding fastener" },
  { word: "MOUNTAIN", clue: "Very tall landform" },
  { word: "VALLEY", clue: "Low land between hills" },
  { word: "FOREST", clue: "Large area of trees" },
  { word: "MEADOW", clue: "Grassy open field" },
  { word: "GLACIER", clue: "Slow-moving mass of ice" },
  { word: "CANYON", clue: "Deep narrow valley" },
  { word: "PRAIRIE", clue: "Wide grassy plain" },
  { word: "SWAMP", clue: "Wet marshy land" },
  { word: "BEACH", clue: "Sandy shore by the sea" },
  { word: "HARBOR", clue: "Sheltered dock for ships" },
  { word: "LAGOON", clue: "Shallow body of water" },
  { word: "STREAM", clue: "Small flowing river" },
  { word: "PEBBLE", clue: "Small smooth stone" },
  { word: "HOSPITAL", clue: "Place where the sick are treated" },
  { word: "SCHOOL", clue: "Place where children learn" },
  { word: "CHURCH", clue: "Place of worship" },
  { word: "STADIUM", clue: "Large sports arena" },
  { word: "THEATER", clue: "Place for watching plays" },
  { word: "MUSEUM", clue: "Place displaying artifacts" },
  { word: "FACTORY", clue: "Place where goods are made" },
  { word: "OFFICE", clue: "Place of business work" },
  { word: "BAKERY", clue: "Shop that sells baked goods" },
  { word: "DOCTOR", clue: "Medical professional" },
  { word: "TEACHER", clue: "Person who educates students" },
  { word: "FARMER", clue: "Person who grows crops" },
  { word: "DENTIST", clue: "Doctor for teeth" },
  { word: "LAWYER", clue: "Legal professional" },
  { word: "PLUMBER", clue: "Fixes pipes and leaks" },
  { word: "SCARLET", clue: "Bright red color" },
  { word: "CRIMSON", clue: "Deep red color" },
  { word: "MAROON", clue: "Dark brownish-red color" },
  { word: "INDIGO", clue: "Deep blue-purple color" },
  { word: "VIOLET", clue: "Purple color" },
  { word: "BEIGE", clue: "Pale sandy color" },
  { word: "IVORY", clue: "Off-white color" },
  { word: "AMBER", clue: "Orange-yellow color" },
  { word: "DOZEN", clue: "Group of twelve" },
  { word: "CENTURY", clue: "One hundred years" },
  { word: "DECADE", clue: "Ten years" },
  { word: "MILLION", clue: "1,000,000" },
  { word: "ZERO", clue: "The number 0" },
  { word: "INFINITY", clue: "Endless amount" },
  { word: "FRACTION", clue: "Part of a whole" },
  { word: "PERCENT", clue: "Out of one hundred" },
  { word: "AVERAGE", clue: "Typical or mean value" },
  { word: "SOCCER", clue: "Sport played with a round ball and feet" },
  { word: "TENNIS", clue: "Sport played with rackets" },
  { word: "HOCKEY", clue: "Sport played with a puck or ball and sticks" },
  { word: "BOXING", clue: "Combat sport with punches" },
  { word: "CRICKET", clue: "Bat-and-ball sport" },
  { word: "RUGBY", clue: "Sport with an oval ball" },
  { word: "GOLF", clue: "Sport played with clubs and a small ball" },
  { word: "CYCLING", clue: "Sport of riding bikes" },
  { word: "MARATHON", clue: "Long-distance race" },
  { word: "WRESTLING", clue: "Grappling combat sport" },
  { word: "FENCING", clue: "Sport with swords" },
  { word: "ARCHERY", clue: "Sport of shooting arrows" },
  { word: "BOWLING", clue: "Sport of knocking down pins" },
  { word: "SKATING", clue: "Gliding on skates" },
  { word: "SURFING", clue: "Riding ocean waves on a board" },
  { word: "DIVING", clue: "Jumping into water" },
  { word: "ROWING", clue: "Propelling a boat with oars" },
  { word: "SPRINT", clue: "Short fast race" },
  { word: "HURDLE", clue: "Obstacle jumped in a race" },
  { word: "COMET", clue: "Icy object that orbits the sun" },
  { word: "METEOR", clue: "Shooting star" },
  { word: "ASTEROID", clue: "Rocky object orbiting the sun" },
  { word: "GALAXY", clue: "Huge group of stars" },
  { word: "NEBULA", clue: "Cloud of gas and dust in space" },
  { word: "SATELLITE", clue: "Object orbiting a planet" },
  { word: "ASTRONAUT", clue: "Space traveler" },
  { word: "TELESCOPE", clue: "Device for viewing distant objects" },
  { word: "ORBIT", clue: "Path around a celestial body" },
  { word: "ECLIPSE", clue: "When one celestial body blocks another" },
  { word: "MERCURY", clue: "Closest planet to the sun" },
  { word: "VENUS", clue: "Second planet from the sun" },
  { word: "SATURN", clue: "Ringed planet" },
  { word: "JUPITER", clue: "Largest planet" },
  { word: "URANUS", clue: "Seventh planet from the sun" },
  { word: "JACKET", clue: "Outer garment worn over a shirt" },
  { word: "SWEATER", clue: "Warm knitted top" },
  { word: "SANDAL", clue: "Open-toed footwear" },
  { word: "SNEAKER", clue: "Casual athletic shoe" },
  { word: "SCARF", clue: "Cloth worn around the neck" },
  { word: "GLOVE", clue: "Hand covering" },
  { word: "HELMET", clue: "Protective head covering" },
  { word: "NECKLACE", clue: "Jewelry worn around the neck" },
  { word: "BRACELET", clue: "Jewelry worn on the wrist" },
  { word: "EARRING", clue: "Jewelry worn on the ear" },
  { word: "RIBBON", clue: "Decorative strip of fabric" },
  { word: "APRON", clue: "Garment worn while cooking" },
  { word: "SOFA", clue: "Cushioned seat for multiple people" },
  { word: "SHELF", clue: "Flat surface for storing items" },
  { word: "DRAWER", clue: "Sliding storage compartment" },
  { word: "CABINET", clue: "Storage cupboard" },
  { word: "WARDROBE", clue: "Furniture for storing clothes" },
  { word: "COUCH", clue: "Another word for sofa" },
  { word: "STOOL", clue: "Seat without a back" },
  { word: "BENCH", clue: "Long seat for several people" },
  { word: "BICYCLE", clue: "Two-wheeled pedal vehicle" },
  { word: "SCOOTER", clue: "Small two-wheeled vehicle" },
  { word: "TRUCK", clue: "Large vehicle for hauling goods" },
  { word: "TRACTOR", clue: "Farm vehicle for pulling equipment" },
  { word: "SUBMARINE", clue: "Vessel that travels underwater" },
  { word: "BALLOON", clue: "Inflatable flying craft" },
  { word: "CANOE", clue: "Narrow paddled boat" },
  { word: "KAYAK", clue: "Small paddled boat" },
  { word: "FERRY", clue: "Boat that carries passengers across water" },
  { word: "TRAM", clue: "Vehicle running on city rails" },
  { word: "SUBWAY", clue: "Underground train system" },
  { word: "WAGON", clue: "Vehicle pulled by animals" },
  { word: "SLEIGH", clue: "Vehicle that glides on snow" },
  { word: "VIOLIN", clue: "Four-stringed instrument played with a bow" },
  { word: "TRUMPET", clue: "Brass instrument you blow into" },
  { word: "CLARINET", clue: "Woodwind instrument with a single reed" },
  { word: "FLUTE", clue: "Woodwind instrument you blow across" },
  { word: "DRUM", clue: "Percussion instrument you hit" },
  { word: "PIANO", clue: "Instrument with black and white keys" },
  { word: "HARP", clue: "Large stringed instrument" },
  { word: "CELLO", clue: "Large bowed string instrument" },
  { word: "TROMBONE", clue: "Brass instrument with a sliding tube" },
  { word: "ELBOW", clue: "Joint between forearm and upper arm" },
  { word: "SHOULDER", clue: "Joint connecting arm to body" },
  { word: "ANKLE", clue: "Joint between foot and leg" },
  { word: "WRIST", clue: "Joint between hand and forearm" },
  { word: "FOREHEAD", clue: "Upper part of the face" },
  { word: "EYEBROW", clue: "Hair above the eye" },
  { word: "NOSTRIL", clue: "Opening in the nose" },
  { word: "KNUCKLE", clue: "Joint of a finger" },
  { word: "THUMB", clue: "Shortest finger" },
  { word: "FINGER", clue: "Digit on the hand" },
  { word: "KIDNEY", clue: "Organ that filters blood" },
  { word: "DROUGHT", clue: "Long period without rain" },
  { word: "HUMIDITY", clue: "Amount of moisture in the air" },
  { word: "BLIZZARD", clue: "Severe snowstorm" },
  { word: "HAIL", clue: "Frozen rain pellets" },
  { word: "MIST", clue: "Light fog" },
  { word: "FOG", clue: "Thick cloud near the ground" },
  { word: "MONSOON", clue: "Seasonal heavy rain" },
  { word: "GALE", clue: "Very strong wind" },
  { word: "DRIZZLE", clue: "Light rain" },
  { word: "PENINSULA", clue: "Land surrounded by water on three sides" },
  { word: "PLATEAU", clue: "Flat elevated land" },
  { word: "DELTA", clue: "Landform at a river's mouth" },
  { word: "ESTUARY", clue: "Where a river meets the sea" },
  { word: "TUNDRA", clue: "Cold, treeless biome" },
  { word: "SAVANNA", clue: "Grassy plain with scattered trees" },
  { word: "FJORD", clue: "Narrow inlet between cliffs" },
  { word: "ATOLL", clue: "Ring-shaped coral island" },
  { word: "CLIFF", clue: "Steep rock face" },
  { word: "RIDGE", clue: "Long narrow hilltop" },
  { word: "DUNE", clue: "Hill of sand" },
  { word: "CRATER", clue: "Bowl-shaped depression" },
  { word: "CONTINENT", clue: "One of Earth's major landmasses" },
  { word: "MOLECULE", clue: "Group of bonded atoms" },
  { word: "ATOM", clue: "Basic unit of matter" },
  { word: "ELECTRON", clue: "Negatively charged particle" },
  { word: "PROTON", clue: "Positively charged particle" },
  { word: "NEUTRON", clue: "Neutral particle in an atom" },
  { word: "GRAVITY", clue: "Force that pulls objects together" },
  { word: "MAGNET", clue: "Object that attracts iron" },
  { word: "ENERGY", clue: "Capacity to do work" },
  { word: "VELOCITY", clue: "Speed in a given direction" },
  { word: "PRESSURE", clue: "Force applied over an area" },
  { word: "DENSITY", clue: "Mass per unit volume" },
  { word: "CHEMICAL", clue: "Substance used in reactions" },
  { word: "BACTERIA", clue: "Microscopic single-celled organisms" },
  { word: "VIRUS", clue: "Tiny infectious agent" },
  { word: "VACCINE", clue: "Shot that builds immunity" },
  { word: "JOYFUL", clue: "Feeling great happiness" },
  { word: "ANXIOUS", clue: "Feeling worried" },
  { word: "NERVOUS", clue: "Feeling uneasy" },
  { word: "CONFUSED", clue: "Unable to understand" },
  { word: "CURIOUS", clue: "Eager to know more" },
  { word: "JEALOUS", clue: "Envious of someone" },
  { word: "GRATEFUL", clue: "Feeling thankful" },
  { word: "ASHAMED", clue: "Feeling embarrassed about something" },
  { word: "PROUD", clue: "Feeling satisfied with an achievement" },
  { word: "LONELY", clue: "Feeling alone" },
  { word: "PLIERS", clue: "Tool for gripping and bending" },
  { word: "CHISEL", clue: "Tool for carving wood or stone" },
  { word: "DRILL", clue: "Tool for boring holes" },
  { word: "SANDER", clue: "Tool for smoothing surfaces" },
  { word: "LEVEL", clue: "Tool for checking if something is flat" },
  { word: "CLAMP", clue: "Tool that holds things tightly" },
  { word: "TROWEL", clue: "Small hand tool for digging" },
  { word: "RAKE", clue: "Garden tool with tines" },
  { word: "BEETLE", clue: "Hard-shelled insect" },
  { word: "MOSQUITO", clue: "Blood-sucking flying insect" },
  { word: "LADYBUG", clue: "Small red spotted beetle" },
  { word: "FIREFLY", clue: "Insect that glows in the dark" },
  { word: "TERMITE", clue: "Wood-eating insect" },
  { word: "WASP", clue: "Stinging flying insect" },
  { word: "MOTH", clue: "Nocturnal cousin of the butterfly" },
  { word: "SALMON", clue: "Pink fish that swims upstream" },
  { word: "TROUT", clue: "Freshwater fish" },
  { word: "CATFISH", clue: "Fish with whisker-like barbels" },
  { word: "STINGRAY", clue: "Flat fish with a venomous tail" },
  { word: "STARFISH", clue: "Star-shaped sea creature" },
  { word: "CLAM", clue: "Bivalve mollusk" },
  { word: "OYSTER", clue: "Shellfish that can produce pearls" },
  { word: "SQUID", clue: "Sea creature with ten arms" },
  { word: "ANEMONE", clue: "Colorful stinging sea creature" },
  { word: "CANADA", clue: "North American country, maple leaf flag" },
  { word: "MEXICO", clue: "Country south of the United States" },
  { word: "BRAZIL", clue: "Largest country in South America" },
  { word: "FRANCE", clue: "Country known for the Eiffel Tower" },
  { word: "GERMANY", clue: "European country known for Oktoberfest" },
  { word: "ITALY", clue: "Boot-shaped European country" },
  { word: "SPAIN", clue: "Country known for flamenco and paella" },
  { word: "JAPAN", clue: "Island nation known for sushi" },
  { word: "CHINA", clue: "Most populous country in Asia" },
  { word: "INDIA", clue: "Country known for the Taj Mahal" },
  { word: "EGYPT", clue: "Country known for pyramids" },
  { word: "KENYA", clue: "East African country known for safaris" },
  { word: "NORWAY", clue: "Scandinavian country known for fjords" },
  { word: "SWEDEN", clue: "Scandinavian country, home of IKEA" },
  { word: "POLAND", clue: "Central European country" },
  { word: "GREECE", clue: "Country known for ancient ruins" },
  { word: "TURKEY", clue: "Country spanning Europe and Asia" },
  { word: "RUSSIA", clue: "Largest country by land area" },
  { word: "IRELAND", clue: "Country known as the Emerald Isle" },
  { word: "ICELAND", clue: "Nordic island known for geysers" },
  { word: "JOURNEY", clue: "A long trip" },
  { word: "VICTORY", clue: "A win" },
  { word: "DEFEAT", clue: "A loss" },
  { word: "MYSTERY", clue: "Something unexplained" },
  { word: "SECRET", clue: "Something kept hidden" },
  { word: "RIDDLE", clue: "A tricky puzzle question" },
  { word: "LEGEND", clue: "A traditional story" },
  { word: "MYTH", clue: "An ancient traditional tale" },
  { word: "FABLE", clue: "A short moral story" },
  { word: "STORY", clue: "A tale told or written" },
  { word: "NOVEL", clue: "A long fictional book" },
  { word: "POEM", clue: "A piece of written verse" },
  { word: "CHAPTER", clue: "A section of a book" },
  { word: "SENTENCE", clue: "A grammatical unit of words" },
  { word: "GRAMMAR", clue: "Rules of a language" },
  { word: "ALPHABET", clue: "The letters of a language" },
  { word: "LANGUAGE", clue: "A system of communication" },
  { word: "DIALECT", clue: "A regional form of a language" },
  { word: "BIRTHDAY", clue: "Annual celebration of your birth" },
  { word: "WEDDING", clue: "Marriage ceremony" },
  { word: "FESTIVAL", clue: "A celebration event" },
  { word: "PARADE", clue: "A public procession" },
  { word: "CARNIVAL", clue: "A festive traveling fair" },
  { word: "HOLIDAY", clue: "A day of celebration or rest" },
  { word: "CEREMONY", clue: "A formal ritual event" },
  { word: "BANQUET", clue: "An elaborate feast" },
  { word: "CONFETTI", clue: "Small paper pieces thrown at celebrations" },
  { word: "CLASSROOM", clue: "Room where lessons are taught" },
  { word: "HOMEWORK", clue: "Schoolwork done at home" },
  { word: "TEXTBOOK", clue: "Book used for studying a subject" },
  { word: "NOTEBOOK", clue: "Book for writing notes" },
  { word: "CRAYON", clue: "Wax stick for coloring" },
  { word: "MARKER", clue: "Felt-tipped pen" },
  { word: "ERASER", clue: "Tool for removing pencil marks" },
  { word: "RULER", clue: "Tool for measuring straight lines" },
  { word: "CALCULATOR", clue: "Device for doing math" },
  { word: "SPATULA", clue: "Flat kitchen tool for flipping food" },
  { word: "LADLE", clue: "Long-handled spoon for soup" },
  { word: "WHISK", clue: "Tool for beating eggs" },
  { word: "COLANDER", clue: "Perforated bowl for draining food" },
  { word: "SKILLET", clue: "Frying pan" },
  { word: "KETTLE", clue: "Container for boiling water" },
  { word: "TOASTER", clue: "Appliance for browning bread" },
  { word: "BLENDER", clue: "Appliance for mixing food" },
  { word: "GRIDDLE", clue: "Flat cooking surface" },
  { word: "PLATTER", clue: "Large serving plate" },
  { word: "BUDGET", clue: "A financial spending plan" },
  { word: "INVOICE", clue: "A bill for goods or services" },
  { word: "RECEIPT", clue: "Proof of purchase" },
  { word: "CURRENCY", clue: "A country's form of money" },
  { word: "DEPOSIT", clue: "Money placed into an account" },
  { word: "INTEREST", clue: "Money earned or paid on a loan" },
  { word: "MORTGAGE", clue: "A loan for buying a house" },
  { word: "INVESTOR", clue: "Person who puts money into ventures" },
  { word: "SALARY", clue: "Fixed regular pay" },
  { word: "ENGINE", clue: "The machine that powers a vehicle" },
  { word: "STEERING", clue: "System used to control direction" },
  { word: "BUMPER", clue: "Protective bar on a vehicle" },
  { word: "DASHBOARD", clue: "Panel with a car's controls" },
  { word: "GEARBOX", clue: "Part that changes a vehicle's gears" },
  { word: "EXHAUST", clue: "System that releases engine gases" },
  { word: "RADIATOR", clue: "Part that cools an engine" },
  { word: "IGNITION", clue: "System that starts an engine" },
  { word: "BATTERY", clue: "Device that stores electric charge" },
  { word: "OTTER", clue: "Playful aquatic mammal" },
  { word: "BEAVER", clue: "Dam-building rodent" },
  { word: "RACCOON", clue: "Masked nocturnal mammal" },
  { word: "SQUIRREL", clue: "Tree-dwelling rodent" },
  { word: "HEDGEHOG", clue: "Spiny small mammal" },
  { word: "SKUNK", clue: "Mammal known for its smell" },
  { word: "WEASEL", clue: "Small slender predator" },
  { word: "FERRET", clue: "Domesticated weasel-like pet" },
  { word: "CHIPMUNK", clue: "Small striped rodent" },
  { word: "MOOSE", clue: "Large antlered mammal" },
  { word: "BISON", clue: "Large shaggy grazing animal" },
  { word: "BUFFALO", clue: "Large horned bovine" },
  { word: "ANTELOPE", clue: "Fast-running horned mammal" },
  { word: "GAZELLE", clue: "Graceful African antelope" },
  { word: "SATURDAY", clue: "Day between Friday and Sunday" },
  { word: "SUNDAY", clue: "First day of the week" },
  { word: "MONDAY", clue: "Day after Sunday" },
  { word: "TUESDAY", clue: "Day after Monday" },
  { word: "THURSDAY", clue: "Day before Friday" },
  { word: "JANUARY", clue: "First month of the year" },
  { word: "FEBRUARY", clue: "Shortest month of the year" },
  { word: "MARCH", clue: "Third month of the year" },
  { word: "APRIL", clue: "Month known for showers" },
  { word: "AUGUST", clue: "Eighth month of the year" },
  { word: "OCTOBER", clue: "Month of Halloween" },
  { word: "NOVEMBER", clue: "Eleventh month of the year" },
  { word: "DECEMBER", clue: "Last month of the year" },
  { word: "SUMMER", clue: "Hottest season" },
  { word: "AUTUMN", clue: "Season after summer" },
  { word: "SPRING", clue: "Season of new growth" },
  { word: "TRIANGLE", clue: "Three-sided shape" },
  { word: "SQUARE", clue: "Four-sided equal shape" },
  { word: "CIRCLE", clue: "Perfectly round shape" },
  { word: "RECTANGLE", clue: "Four-sided shape with right angles" },
  { word: "OCTAGON", clue: "Eight-sided shape" },
  { word: "HEXAGON", clue: "Six-sided shape" },
  { word: "PENTAGON", clue: "Five-sided shape" },
  { word: "SPHERE", clue: "Perfectly round solid shape" },
  { word: "CYLINDER", clue: "Tube-shaped solid" },
  { word: "PYRAMID", clue: "Solid with a square base and triangular sides" },
  { word: "GUITARIST", clue: "Person who plays guitar" },
  { word: "SINGER", clue: "Person who performs vocally" },
  { word: "DANCER", clue: "Person who performs dance" },
  { word: "ACTOR", clue: "Person who performs in films or plays" },
  { word: "DIRECTOR", clue: "Person who oversees a film or play" },
  { word: "AUTHOR", clue: "Person who writes books" },
  { word: "POET", clue: "Person who writes poetry" },
  { word: "SCULPTOR", clue: "Person who creates statues" },
  { word: "ARCHITECT", clue: "Person who designs buildings" },
  { word: "ENGINEER", clue: "Person who designs and builds systems" },
  { word: "SCIENTIST", clue: "Person who studies the natural world" },
  { word: "CHEMIST", clue: "Scientist who studies chemicals" },
  { word: "BIOLOGIST", clue: "Scientist who studies living things" },
  { word: "PHYSICIST", clue: "Scientist who studies matter and energy" },
  { word: "ASTRONOMER", clue: "Scientist who studies space" },
  { word: "GEOLOGIST", clue: "Scientist who studies rocks" },
  { word: "HISTORIAN", clue: "Person who studies the past" },
  { word: "JOURNALIST", clue: "Person who reports the news" },
  { word: "PHOTOGRAPHER", clue: "Person who takes pictures" },
  { word: "DESIGNER", clue: "Person who plans how something looks" },
  { word: "ATHLETE", clue: "Person skilled in sports" },
  { word: "REFEREE", clue: "Person who enforces rules in a game" },
  { word: "COACH", clue: "Person who trains athletes" },
  { word: "PILOT", clue: "Person who flies an aircraft" },
  { word: "SAILOR", clue: "Person who works on a ship" },
  { word: "FIREFIGHTER", clue: "Person who puts out fires" },
  { word: "POLICE", clue: "Force that enforces the law" },
  { word: "GUARD", clue: "Person who protects a place" },
  { word: "WAITER", clue: "Person who serves food at a restaurant" },
  { word: "CASHIER", clue: "Person who handles payments" },
  { word: "MANAGER", clue: "Person who oversees a business" },
  { word: "SECRETARY", clue: "Person who handles office administration" },
  { word: "ACCOUNTANT", clue: "Person who manages financial records" },
  { word: "ELECTRICIAN", clue: "Person who works with wiring" },
  { word: "MECHANIC", clue: "Person who repairs vehicles" },
  { word: "TAILOR", clue: "Person who makes and alters clothing" },
  { word: "BARBER", clue: "Person who cuts hair" },
  { word: "FLORIST", clue: "Person who arranges and sells flowers" },
  { word: "JEWELER", clue: "Person who makes or sells jewelry" },
  { word: "BUTCHER", clue: "Person who sells meat" },
  { word: "FISHERMAN", clue: "Person who catches fish for a living" },
  { word: "SHEPHERD", clue: "Person who herds sheep" },
  { word: "GARDENER", clue: "Person who tends plants" },
  { word: "CLEANER", clue: "Person who tidies spaces" },
  { word: "DRIVER", clue: "Person who operates a vehicle" },
  { word: "PASSENGER", clue: "Person riding in a vehicle" },
  { word: "TOURIST", clue: "Person visiting a place for leisure" },
  { word: "EXPLORER", clue: "Person who travels to discover new places" },
  { word: "HERMIT", clue: "Person who lives alone away from others" },
  { word: "STRANGER", clue: "Person you don't know" },
  { word: "NEIGHBOR", clue: "Person who lives nearby" },
  { word: "SIBLING", clue: "A brother or sister" },
  { word: "COUSIN", clue: "Child of your aunt or uncle" },
  { word: "GRANDFATHER", clue: "Father of your parent" },
  { word: "GRANDMOTHER", clue: "Mother of your parent" },
  { word: "NEPHEW", clue: "Son of your sibling" },
  { word: "NIECE", clue: "Daughter of your sibling" },
];

const MAX_WORDS = 15;
const GENERATION_ATTEMPTS = 30;

// --- Deterministic seeded RNG so everyone gets the SAME puzzle on the
// same calendar date (mulberry32 PRNG, seeded from a hash of the date). ---
function hashStringToInt(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD", UTC-based
}

function shuffleSeeded(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function placeWords(pool, rng) {
  const cellMap = new Map();
  const placed = [];

  const canPlace = (word, row, col, dir) => {
    for (let i = 0; i < word.length; i++) {
      const r = dir === "D" ? row + i : row;
      const c = dir === "A" ? col + i : col;
      const key = `${r},${c}`;
      const occupied = cellMap.has(key);

      if (occupied) {
        // This must be a genuine intersection — letter must match.
        if (cellMap.get(key) !== word[i]) return false;
      } else {
        // Not an intersection: the cells beside this letter (perpendicular
        // to the word's direction) must be empty. Otherwise this new
        // letter would sit directly next to an unrelated existing word,
        // creating an accidental, unregistered "fake" word fragment.
        if (dir === "A") {
          if (cellMap.has(`${r - 1},${c}`)) return false;
          if (cellMap.has(`${r + 1},${c}`)) return false;
        } else {
          if (cellMap.has(`${r},${c - 1}`)) return false;
          if (cellMap.has(`${r},${c + 1}`)) return false;
        }
      }
    }
    const beforeR = dir === "D" ? row - 1 : row;
    const beforeC = dir === "A" ? col - 1 : col;
    if (cellMap.has(`${beforeR},${beforeC}`)) return false;
    const afterR = dir === "D" ? row + word.length : row;
    const afterC = dir === "A" ? col + word.length : col;
    if (cellMap.has(`${afterR},${afterC}`)) return false;
    return true;
  };

  const place = (word, row, col, dir, clue) => {
    for (let i = 0; i < word.length; i++) {
      const r = dir === "D" ? row + i : row;
      const c = dir === "A" ? col + i : col;
      cellMap.set(`${r},${c}`, word[i]);
    }
    placed.push({ word, row, col, dir, clue });
  };

  const first = pool[0];
  place(first.word, 0, 0, "A", first.clue);

  for (let idx = 1; idx < pool.length && placed.length < MAX_WORDS; idx++) {
    const { word, clue } = pool[idx];
    if (placed.some((p) => p.word === word)) continue;

    const tryList = [];
    for (const [key, letter] of cellMap.entries()) {
      const [er, ec] = key.split(",").map(Number);
      for (let li = 0; li < word.length; li++) {
        if (word[li] === letter) tryList.push({ er, ec, li });
      }
    }
    shuffleSeeded(tryList, rng);

    let placedThis = false;
    for (const t of tryList) {
      for (const dir of shuffleSeeded(["A", "D"], rng)) {
        const row = dir === "D" ? t.er - t.li : t.er;
        const col = dir === "A" ? t.ec - t.li : t.ec;
        if (canPlace(word, row, col, dir)) {
          place(word, row, col, dir, clue);
          placedThis = true;
          break;
        }
      }
      if (placedThis) break;
    }
  }

  return placed;
}

function buildDailyPuzzle(dateKey) {
  const rng = mulberry32(hashStringToInt(dateKey));
  let best = null;
  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt++) {
    const pool = shuffleSeeded(WORD_BANK, rng);
    const placed = placeWords(pool, rng);
    if (!best || placed.length > best.length) best = placed;
    if (best.length >= MAX_WORDS) break;
  }

  let minR = Infinity,
    minC = Infinity,
    maxR = -Infinity,
    maxC = -Infinity;
  for (const p of best) {
    for (let i = 0; i < p.word.length; i++) {
      const r = p.dir === "D" ? p.row + i : p.row;
      const c = p.dir === "A" ? p.col + i : p.col;
      minR = Math.min(minR, r);
      minC = Math.min(minC, c);
      maxR = Math.max(maxR, r);
      maxC = Math.max(maxC, c);
    }
  }

  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const solution = Array.from({ length: rows }, () => Array(cols).fill(null));
  const placements = best.map((p) => ({
    ...p,
    row: p.row - minR,
    col: p.col - minC,
  }));

  for (const p of placements) {
    for (let i = 0; i < p.word.length; i++) {
      const r = p.dir === "D" ? p.row + i : p.row;
      const c = p.dir === "A" ? p.col + i : p.col;
      solution[r][c] = p.word[i];
    }
  }

  const sortedStartCoords = [
    ...new Set(placements.map((p) => `${p.row},${p.col}`)),
  ].sort((a, b) => {
    const [ar, ac] = a.split(",").map(Number);
    const [br, bc] = b.split(",").map(Number);
    return ar - br || ac - bc;
  });
  const starts = new Map();
  sortedStartCoords.forEach((key, i) => starts.set(key, i + 1));

  const numbers = {};
  starts.forEach((num, key) => {
    numbers[key] = num;
  });

  const clues = { across: {}, down: {} };
  for (const p of placements) {
    const num = starts.get(`${p.row},${p.col}`);
    if (p.dir === "A") clues.across[num] = p.clue;
    else clues.down[num] = p.clue;
  }

  return { solution, numbers, clues, rows, cols, placements };
}

function firstOpenCell(p) {
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (p.solution[r][c]) return { r, c };
    }
  }
  return { r: 0, c: 0 };
}

function isOpenStatic(p, r, c) {
  return (
    r >= 0 && r < p.rows && c >= 0 && c < p.cols && p.solution[r][c] !== null
  );
}

function sameAcrossWord(puzzle, r, c, selectedC) {
  const lo = Math.min(c, selectedC);
  const hi = Math.max(c, selectedC);
  for (let x = lo; x <= hi; x++) {
    if (!isOpenStatic(puzzle, r, x)) return false;
  }
  return true;
}
function sameDownWord(puzzle, r, c, selectedR) {
  const lo = Math.min(r, selectedR);
  const hi = Math.max(r, selectedR);
  for (let y = lo; y <= hi; y++) {
    if (!isOpenStatic(puzzle, y, c)) return false;
  }
  return true;
}

export default function CrosswordGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const dateKey = todayKey();
  const [puzzle] = useState(() => buildDailyPuzzle(dateKey));
  const [grid, setGrid] = useState(() =>
    Array.from({ length: puzzle.rows }, () => Array(puzzle.cols).fill("")),
  );
  const [selected, setSelected] = useState(() => firstOpenCell(puzzle));
  const [direction, setDirection] = useState("across");

  const alreadySolvedToday =
    typeof window !== "undefined" &&
    localStorage.getItem("crossword-solved-date") === dateKey;

  const [gameState, setGameState] = useState(
    alreadySolvedToday ? "won" : "playing",
  );
  const [timer, setTimer] = useState(0);
  const [streak, setStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const timerRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const selectedRef = useRef(selected);
  const directionRef = useRef(direction);
  const gridRef = useRef(grid);
  const puzzleRef = useRef(puzzle);

  const isOpen = (p, r, c) => isOpenStatic(p, r, c);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);
  useEffect(() => {
    puzzleRef.current = puzzle;
  }, [puzzle]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchLeaderboard = useCallback(() => {
    api
      .get("/arcade/crossword/leaderboard")
      .then((res) => {
        if (res.data) {
          const sorted = res.data.sort((a, b) => b.score - a.score); // score = streak, highest first
          setLeaderboard(sorted);
          if (currentUser) {
            const mine = sorted.find(
              (entry) => entry.user?.username === currentUser.username,
            );
            if (mine) setStreak(mine.score);
          }
        }
      })
      .catch(console.error);
  }, [currentUser]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => setTimer((p) => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  useEffect(() => {
    if (!alreadySolvedToday) hiddenInputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== "playing") return;
      const p = puzzleRef.current;
      const { r, c } = selectedRef.current;

      const step = (dr, dc, dir) => {
        let nr = r + dr;
        let nc = c + dc;
        while (
          nr >= 0 &&
          nr < p.rows &&
          nc >= 0 &&
          nc < p.cols &&
          !isOpen(p, nr, nc)
        ) {
          nr += dr;
          nc += dc;
        }
        if (isOpen(p, nr, nc)) {
          setSelected({ r: nr, c: nc });
          setDirection(dir);
        }
      };

      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(0, 1, "across");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(0, -1, "across");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        step(1, 0, "down");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        step(-1, 0, "down");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  const validateGrid = (currentGrid, p) => {
    for (let r = 0; r < p.rows; r++) {
      for (let c = 0; c < p.cols; c++) {
        if (p.solution[r][c] === null) continue;
        if (currentGrid[r][c] !== p.solution[r][c]) return false;
      }
    }
    return true;
  };

  const advance = (dr, dc) => {
    const p = puzzleRef.current;
    const { r, c } = selectedRef.current;
    const nr = r + dr;
    const nc = c + dc;
    if (isOpen(p, nr, nc)) setSelected({ r: nr, c: nc });
  };

  const handleInput = async (char) => {
    if (gameState !== "playing") return;
    const p = puzzleRef.current;
    const { r, c } = selectedRef.current;
    const direction = directionRef.current;
    const newGrid = gridRef.current.map((row) => [...row]);

    if (char === "DEL") {
      if (newGrid[r][c]) {
        newGrid[r][c] = "";
        setGrid(newGrid);
      } else {
        if (direction === "across") advance(0, -1);
        else advance(-1, 0);
      }
      return;
    }

    if (!isOpen(p, r, c)) return;
    newGrid[r][c] = char;
    setGrid(newGrid);

    if (validateGrid(newGrid, p)) {
      setGameState("won");
      localStorage.setItem("crossword-solved-date", dateKey);
      try {
        const res = await api.post("/arcade/crossword/score", {
          score: timer,
        });
        if (res.data?.streak != null) setStreak(res.data.streak);
        fetchLeaderboard();
      } catch (err) {
        console.error("Failed to save crossword streak", err);
      }
      return;
    }

    if (direction === "across") advance(0, 1);
    else advance(1, 0);
  };

  const handleCellClick = (r, c) => {
    if (!isOpen(puzzleRef.current, r, c)) return;
    if (selected.r === r && selected.c === c) {
      setDirection((prev) => (prev === "across" ? "down" : "across"));
    } else {
      setSelected({ r, c });
    }
    hiddenInputRef.current?.focus();
  };

  const getActiveClue = () => {
    const p = puzzleRef.current;
    const { r, c } = selected;
    let sr = r,
      sc = c;
    if (direction === "across") {
      while (isOpen(p, sr, sc - 1)) sc -= 1;
    } else {
      while (isOpen(p, sr - 1, sc)) sr -= 1;
    }
    const num = p.numbers[`${sr},${sc}`];
    if (!num) return "";
    const clueText =
      direction === "across" ? p.clues.across[num] : p.clues.down[num];
    return clueText
      ? `${num} ${direction === "across" ? "Across" : "Down"}: ${clueText}`
      : "";
  };

  const boardMaxWidth = isMobile ? 400 : 480;

  const hiddenInput = (
    <input
      ref={hiddenInputRef}
      type="text"
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
      value=" "
      onChange={(e) => {
        const val = e.target.value;
        if (val === "") {
          handleInput("DEL");
        } else if (val.length > 1) {
          const char = val.slice(-1);
          if (/^[a-zA-Z]$/.test(char)) handleInput(char.toUpperCase());
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Backspace") {
          e.preventDefault();
          handleInput("DEL");
        }
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "1px",
        height: "1px",
        opacity: 0.01,
      }}
    />
  );

  const activeClueDisplay = (
    <div
      style={{
        width: "100%",
        maxWidth: boardMaxWidth,
        backgroundColor: "var(--arcade-surface)",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid var(--arcade-border)",
        textAlign: "center",
        color: "var(--arcade-orange)",
        fontWeight: "bold",
        fontSize: "1.05rem",
        minHeight: "1.4em",
      }}
    >
      {gameState === "playing" ? getActiveClue() : "Today's puzzle complete!"}
    </div>
  );

  const crosswordGrid = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
        gridTemplateRows: `repeat(${puzzle.rows}, 1fr)`,
        width: "100%",
        maxWidth: boardMaxWidth,
        aspectRatio: `${puzzle.cols} / ${puzzle.rows}`,
        backgroundColor: "#000",
        border: "3px solid #000",
        gap: "1px",
        userSelect: "none",
        boxSizing: "border-box",
        overflow: "hidden",
        opacity: gameState === "playing" ? 1 : 0.55,
        pointerEvents: gameState === "playing" ? "auto" : "none",
      }}
    >
      {grid.map((row, r) =>
        row.map((letter, c) => {
          const open = isOpen(puzzle, r, c);
          if (!open) {
            return (
              <div
                key={`${r}-${c}`}
                style={{ backgroundColor: "#000", minWidth: 0, minHeight: 0 }}
              />
            );
          }
          const isSelected = selected.r === r && selected.c === c;
          const isWordHighlight =
            direction === "across"
              ? selected.r === r && sameAcrossWord(puzzle, r, c, selected.c)
              : selected.c === c && sameDownWord(puzzle, r, c, selected.r);
          const cellNum = puzzle.numbers[`${r},${c}`];
          const displayLetter =
            gameState === "playing" ? letter : puzzle.solution[r][c];

          return (
            <div
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              style={{
                position: "relative",
                backgroundColor: isSelected
                  ? "#ffeb3b"
                  : isWordHighlight
                    ? "#fff9c4"
                    : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? "clamp(1rem, 4.5vw, 1.6rem)" : "1.9rem",
                fontWeight: "bold",
                color: "#000",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: 0,
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {cellNum && (
                <span
                  style={{
                    position: "absolute",
                    top: "1px",
                    left: "3px",
                    fontSize: "0.55rem",
                    fontWeight: "normal",
                    lineHeight: 1,
                  }}
                >
                  {cellNum}
                </span>
              )}
              {displayLetter || ""}
            </div>
          );
        }),
      )}
    </div>
  );

  const winOverlay = gameState === "won" && (
    <div className="snake-overlay">
      <h2
        style={{ color: "var(--arcade-green)", textShadow: "2px 2px 0 #000" }}
      >
        {alreadySolvedToday && timer === 0
          ? "Already solved today!"
          : "Puzzle Solved!"}
      </h2>
      <p
        style={{
          color: "#fff",
          marginBottom: "6px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          justifyContent: "center",
        }}
      >
        <Flame size={18} color="var(--arcade-orange)" />
        {streak} day streak
      </p>
      <p style={{ color: "var(--arcade-text-dim)", fontSize: "0.85rem" }}>
        Come back tomorrow for a new puzzle.
      </p>
    </div>
  );

  const statsHeader = isMobile ? (
    <div className="arcade-mobile-header mobile-only">
      <button
        className="arcade-mobile-back"
        onClick={() => navigate("/arcade")}
      >
        <ArrowLeft size={20} />
      </button>
      <div>
        Time <span>{timer}s</span>
      </div>
      <div>
        Streak <span>{streak}🔥</span>
      </div>
      <button
        className="arcade-mobile-trophy"
        onClick={() => setIsModalOpen(true)}
      >
        Top Streaks
      </button>
    </div>
  ) : null;

  if (isMobile) {
    return (
      <div style={{ padding: "0" }}>
        {statsHeader}
        <div
          style={{
            width: "100%",
            padding: "15px",
            paddingBottom: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
          onClick={() => hiddenInputRef.current?.focus()}
        >
          {hiddenInput}
          {activeClueDisplay}
          {crosswordGrid}
          {winOverlay}
        </div>
        <ScoreModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          leaderboard={leaderboard}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "0" }}>
      <div className="snake-wireframe-container">
        <div
          className="snake-wireframe-board"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          {hiddenInput}
          {activeClueDisplay}
          {crosswordGrid}
          {winOverlay}
        </div>
        <div className="snake-wireframe-controls desktop-only">
          <div className="snake-wireframe-stats">
            <div className="snake-stat-row">
              Time <span>{timer}s</span>
            </div>
            <div className="snake-stat-row">
              Streak <span>{streak}🔥</span>
            </div>
          </div>
        </div>
      </div>
      <ScoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leaderboard={leaderboard}
      />
    </div>
  );
}
