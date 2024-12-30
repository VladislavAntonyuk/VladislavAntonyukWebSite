let snowflakes_count = 200;

let base_css = `
    .snowflake {
        position: absolute;
        width: 10px;
        height: 10px;
        background: white;
        border-radius: 50%;
    }
`;

if (typeof total !== 'undefined') {
    snowflakes_count = total;
}

const currentDate = new Date();
let year = currentDate.getFullYear();
if (currentDate.getMonth() === 0) {
    year = year - 1;
}

const startDate = new Date(year, 11, 15);
const endDate = new Date(year + 1, 0, 15);
if (currentDate >= startDate && currentDate <= endDate) {
    spawnSnowCSS(snowflakes_count);
    spawn_snow(snowflakes_count);
}

// This function allows you to turn on and off the snow
function toggle_snow(show = true) {
    if (show === true) {
        document.getElementById('snow').style.display = "block";
    } else {
        document.getElementById('snow').style.display = "none";
    }
}

// Creating snowflakes
function spawn_snow(snowDensity = 200) {
    snowDensity -= 1;

    for (let x = 0; x < snowDensity; x++) {
        const board = document.createElement('div');
        board.className = "snowflake";

        document.getElementById('snow').appendChild(board);
    }
}

// Append style for each snowflake to the head
function add_css(rule) {
    const css = document.createElement('style');
    css.appendChild(document.createTextNode(rule)); // Support for the rest
    document.getElementsByTagName("head")[0].appendChild(css);
}

// Math
function random_int(value = 100) {
    return Math.floor(Math.random() * value) + 1;
}

function random_range(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Create style for snowflake
function spawnSnowCSS(snowDensity = 200) {
    const snowflakeName = "snowflake";
    let rule = ``;
    if (typeof base_css !== 'undefined') {
        rule = base_css;
    }

    for (let i = 1; i < snowDensity; i++) {
        const randomX = Math.random() * 90; // vw
        const randomOffset = random_range(-100000, 100000) * 0.0001; // vw;
        const randomXEnd = randomX + randomOffset;
        const randomXEndYoyo = randomX + (randomOffset / 2);
        const randomYoyoTime = random_range(30000, 80000) / 100000;
        const randomYoyoY = randomYoyoTime * 90; // vh
        const randomScale = Math.random();
        const fallDuration = random_range(10, 30) * 1; // s
        const fallDelay = random_int(30) * -1; // s
        const opacity = Math.random();

        rule += `
        .${snowflakeName}:nth-child(${i}) {
            opacity: ${opacity};
            transform: translate(${randomX}vw, -10px) scale(${randomScale});
            animation: fall-${i} ${fallDuration}s ${fallDelay}s linear infinite;
        }

        @keyframes fall-${i} {
            ${randomYoyoTime * 90}% {
                transform: translate(${randomXEnd}vw, ${randomYoyoY}vh) scale(${randomScale});
            }

            to {
                transform: translate(${randomXEndYoyo}vw, 90vh) scale(${randomScale});
            }

        }
        `;
    }

    add_css(rule);
}
