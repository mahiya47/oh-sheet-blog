export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "#ff3e3e" };
  if (score <= 3) return { score, label: "Okay", color: "#ffa53e" };
  if (score === 4) return { score, label: "Good", color: "#c4ff3e" };
  return { score, label: "Strong", color: "#3eff8b" };
}
