const axios = require("axios");
const fs = require("fs");
const { format } = require("fast-csv");
// const { rawAll } = require("../data/rawAll");

const formatCounter = {};

const getJSON = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(txt);
  }
  const json = await response.json();
  return json; // get JSON from the response
};

async function sumFileFormats() {
  //   const allData = getJSON("./data/rawAll.json");
  const rawAll = JSON.parse(fs.readFileSync("./data/rawAll.json"));
  rawAll.result.results.forEach((res) => {
    res.resources.forEach((resource) => {
      console.log("resource", resource.format);
      const format = resource.format;
      formatCounter[format] = formatCounter[format]
        ? formatCounter[format] + 1
        : 1;
    });
  });

  console.log("formatCounter", formatCounter);
}

sumFileFormats();
