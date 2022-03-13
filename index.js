const fs = require("fs");
const svgBadgeFileNames = ["pathfinder-3-120px"];
const { chunk } = require("lodash");

svgBadgeFileNames.forEach((badge) => {
  const data = [];
  const colors = [];
  const cxPositions = [];
  const cyPositions = [];
  const badgePath = `./badges/${badge}.svg`;
  const compressedPath = `./compressed/${badge}.json`;
  const allFileContents = fs.readFileSync(badgePath, "utf-8");
  allFileContents.split(/\r?\n/).forEach((line) => {
    const cxMatch = line.match(/cx='([0-9]+)'/);
    const cyMatch = line.match(/cx='([0-9]+)'/);
    const fillMatch = line.match(/style='fill: rgb\(([0-9, ]+)\);'/);

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
      `<circle cx='${cx}' cy='${cy}' r='5' fill='rgba(${color})' />`
    );
  });

  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='120' height='120'>
  <g stroke-width='0'>
    ${circles.join("\n")}
  </g>
    </svg>
  `;

  console.log(circles);

  fs.writeFileSync(testPath, svg);
});
