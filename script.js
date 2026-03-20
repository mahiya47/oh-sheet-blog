document.addEventListener("DOMContentLoaded", () => {
    const sheetHeaders = document.querySelectorAll(".sheet-header");
    const neobrutalistColors = [
        "#FF3E3E", "#3E54FF", "#3EFF8B", "#FFF03E", "#FF3EEF", 
        "#3EFAFF", "#FFA53E", "#9D3EFF", "#FF3E96", "#C4FF3E"
    ];

    sheetHeaders.forEach(header => {
        const randomColor = neobrutalistColors[Math.floor(Math.random() * neobrutalistColors.length)];
        header.style.backgroundColor = randomColor;
    });

    const backToTopBtn = document.getElementById("backToTop");
    const mainContent = document.querySelector(".sidebar-middle");

    if (mainContent && backToTopBtn) {
        mainContent.onscroll = function() {
            if (mainContent.scrollTop > 300) {
                backToTopBtn.style.display = "block";
            } else {
                backToTopBtn.style.display = "none";
            }
        };

        backToTopBtn.onclick = function() {
            mainContent.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        };
    }

    const tabs = document.querySelectorAll(".feed-tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
        });
    });

    const navLinks = document.querySelectorAll(".settings-nav a:not(.exit-settings)");
    const sections = document.querySelectorAll(".settings-section");

    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const targetId = link.getAttribute("href").substring(1);

                navLinks.forEach(l => l.classList.remove("active"));
                link.classList.add("active");

                sections.forEach(section => {
                    section.classList.remove("active");
                    if (section.id === targetId) {
                        section.classList.add("active");
                    }
                });
            });
        });
    }

    const pfpInput = document.getElementById("pfp-input");
    const pfpPreview = document.getElementById("settings-pfp-preview");

    if (pfpInput && pfpPreview) {
        pfpInput.addEventListener("change", function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    pfpPreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const saveBtn = document.getElementById("save-settings");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const originalText = saveBtn.innerText;
            saveBtn.innerText = "Saved!";
            saveBtn.style.backgroundColor = "#3EFF8B";
            setTimeout(() => {
                saveBtn.innerText = originalText;
                saveBtn.style.backgroundColor = "white";
            }, 2000);
        });
    }
});