const cv = () => {
    document.getElementById('menu').style.display = 'none'
    document.getElementById('about').style.display = 'none'
    document.getElementById('cv').style.display = 'block'
}

const about = () => {
    document.getElementById('menu').style.display = 'none'
    document.getElementById('cv').style.display = 'none'
    document.getElementById('about').style.display = 'block'
}

const emoji = {
    light: '🌞',
    dark: '🌚'
}

const setTheme = theme => {
    if (document.documentElement.className === 'dark')
        theme = 'light'
    else
        theme = 'dark'
    document.documentElement.className = theme
    console.log(theme)
    document.getElementById('color-scheme').innerText = emoji[theme]
}

let postfix = '';

let counter = -5;

let name = '.space';

function typesetting() {

    if (counter > 0) {

        postfix = name.slice(0, counter) + '_';

        if (counter > 5)
            counter = -5;

    } else {

        if (postfix === '')
            postfix = '_';
        else
            postfix = '';
    }

    document.getElementById('typesetting-last').innerText = postfix;

    counter++;
}

typesetting();

let timer = setInterval(typesetting, 500);

