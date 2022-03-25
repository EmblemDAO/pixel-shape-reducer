const fs = require("fs");
const svgBadgeFileNames = fs
  .readdirSync("./badges", { withFileTypes: true })
  .filter((item) => !item.isDirectory())
  .map((item) => item.name.split(".svg")[0]);
const { chunk } = require("lodash");

function rgbHex(red, green, blue, alpha) {
  const isPercent = (red + (alpha || "")).toString().includes("%");

  if (typeof red === "string") {
    [red, green, blue, alpha] = red
      .match(/(0?\.?\d{1,3})%?\b/g)
      .map((component) => Number(component));
  } else if (alpha !== undefined) {
    alpha = Number.parseFloat(alpha);
  }

  if (
    typeof red !== "number" ||
    typeof green !== "number" ||
    typeof blue !== "number" ||
    red > 255 ||
    green > 255 ||
    blue > 255
  ) {
    throw new TypeError("Expected three numbers below 256");
  }

  if (typeof alpha === "number") {
    if (!isPercent && alpha >= 0 && alpha <= 1) {
      alpha = Math.round(255 * alpha);
    } else if (isPercent && alpha >= 0 && alpha <= 100) {
      alpha = Math.round((255 * alpha) / 100);
    } else {
      throw new TypeError(
        `Expected alpha value (${alpha}) as a fraction or percentage`
      );
    }

    alpha = (alpha | (1 << 8)).toString(16).slice(1); // eslint-disable-line no-mixed-operators
  } else {
    alpha = "";
  }

  // TODO: Remove this ignore comment.
  // eslint-disable-next-line no-mixed-operators
  return (
    (blue | (green << 8) | (red << 16) | (1 << 24)).toString(16).slice(1) +
    alpha
  );
}

function compressHex(b, c) {
  return ++c
    ? ((("0x" + b) / 17 + 0.5) | 0).toString(16)
    : b.replace(/../g, compressHex);
}

function lettersToHex(color) {
  const letterToHexMap = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    f: 5,
  };

  return color.split("").map((char) => {
    console.log(char, isNumber(char) ? Number(char) : letterToHexMap[char]);
    return isNumber(char) ? Number(char) : letterToHexMap[char];
  });
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

// javascript check if array is in multidimensional array
function isInArray(needle, haystack) {
  return JSON.stringify(haystack).includes(JSON.stringify(needle));
}

const allColors = [];

svgBadgeFileNames.forEach((badge) => {
  const data = [];
  const colors = [];
  const cxPositions = [];
  const cyPositions = [];
  const badgePath = `./badges/${badge}.svg`;
  const compressedPath = `./compressed/${badge}.json`;
  const allFileContents = fs.readFileSync(badgePath, "utf-8");
  allFileContents.split(/\r?\n/).forEach((line) => {
    const cxMatch = line.match(/cx='([0-9\.]+)'/);
    const cyMatch = line.match(/cy='([0-9\.]+)'/);
    const fillMatch = line.match(/style='fill: (rgb.+);' \/>/);

    const cx = cxMatch ? Number(cxMatch[1]) : null;
    const cy = cyMatch ? Number(cyMatch[1]) : null;
    const fill = fillMatch ? fillMatch[1] : null;
    const compressedFill = fill
      ? lettersToHex(compressHex(rgbHex(fill)))
      : null;

    if (!isInArray(compressedFill, allColors)) {
      allColors.push(compressedFill);
    }

    if (!isInArray(compressedFill, colors)) {
      colors.push(compressedFill);
    }

    if (!cxPositions.includes(cx)) {
      cxPositions.push(cx);
    }

    if (!cyPositions.includes(cy)) {
      cyPositions.push(cy);
    }

    const colorIndex = colors.indexOf(compressedFill);
    const cxIndex = cxPositions.indexOf(cx);
    const cyIndex = cyPositions.indexOf(cy);

    if (cx && cy && compressedFill) {
      data.push(cxIndex, cyIndex, colorIndex);
    }
  });

  const compressedData = {
    colors,
    cxPositions,
    cyPositions,
    data,
  };
  fs.writeFileSync(compressedPath, JSON.stringify(compressedData));
});

svgBadgeFileNames.forEach((badge) => {
  const testPath = `./test/${badge}.svg`;
  const compressedPath = `./compressed/${badge}.json`;
  const allFileContents = fs.readFileSync(compressedPath, "utf-8");
  const circles = [];

  const compressedData = ({ colors, cxPositions, cyPositions, data } =
    JSON.parse(allFileContents));

  const chunkedData = chunk(compressedData.data, 3);

  chunkedData.forEach((line, i) => {
    const cx = cxPositions[line[0]];
    const cy = cyPositions[line[1]];
    const color = colors[line[2]];
    circles.push(`<circle cx='${cx}' cy='${cy}' r='1.25' fill='#${color}' />`);
  });

  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='120' height='120'>
  <g stroke-width='0'>
  <rect x='0' y='0' width='120' height='120' style='fill: rgb(0,0,0);' />
    ${circles.join("\n")}
  </g>
    </svg>
  `;

  fs.writeFileSync(testPath, svg);
});

const allColorsPath = `./colors/all-colors.json`;
fs.writeFileSync(allColorsPath, JSON.stringify({ allColors }));
