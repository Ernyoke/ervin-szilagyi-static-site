function getCurrentTheme() {
    const currentTheme = localStorage.getItem("theme");

    if (currentTheme) {
        return currentTheme;
    }
    return "light";
}

function setHighlightJsTheme() {
    if (getCurrentTheme() === "dark") {
        document.querySelector(`link[title="light"]`).setAttribute("disabled", "disabled");
        document.querySelector(`link[title="dark"]`).removeAttribute("disabled");
    } else {
        document.querySelector(`link[title="light"]`).removeAttribute("disabled");
        document.querySelector(`link[title="dark"]`).setAttribute("disabled", "disabled");
    }
}

function switchTheme() {
    if (document.documentElement.getAttribute("data-theme") === "dark") {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    }
    setHighlightJsTheme();
}

setHighlightJsTheme();
document.documentElement.setAttribute("data-theme", getCurrentTheme());

