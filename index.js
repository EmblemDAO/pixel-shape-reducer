const fs = require("fs");
const svgBadgeFileNames = fs
  .readdirSync("./badges", { withFileTypes: true })
  .filter((item) => !item.isDirectory())
  .map((item) => item.name.split(".svg")[0]);
const { chunk } = require("lodash");

function compressHex(b, c) {
  return ++c ? ((("0x" + b) / 17 + 0.5) | 0).toString(16) : b.replace(/../g, a);
}

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
    const fillMatch = line.match(/style='fill: rgb\([0-9, ]+\);'/);

    const cx = cxMatch ? Number(cxMatch[1]) : null;
    const cy = cyMatch ? Number(cyMatch[1]) : null;
    const fill = fillMatch ? fillMatch[1] : null;

    if (!colors.includes(fill)) {
      colors.push(fill);
    }

    if (!cxPositions.includes(cx)) {
      cxPositions.push(cx);
    }

    if (!cyPositions.includes(cy)) {
      cyPositions.push(cy);
    }

    const colorIndex = colors.indexOf(fill);
    const cxIndex = cxPositions.indexOf(cx);
    const cyIndex = cyPositions.indexOf(cy);

    if (cx && cy && fill) {
      data.push(cxIndex, cyIndex, colorIndex);
    }
  });

  console.log("colors", colors);

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
    circles.push(
      `<circle cx='${cx}' cy='${cy}' r='1.25' fill='rgba(${color})' />`
    );
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
