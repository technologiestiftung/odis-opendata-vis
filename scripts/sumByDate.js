const axios = require("axios");
const fs = require("fs");
const { format } = require("fast-csv");
// const { rawAll } = require("../data/rawAll");

const dates = {};

const getJSON = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(txt);
  }
  const json = await response.json();
  return json; // get JSON from the response
};

function sortByDate(obj) {
  const sortedKeys = Object.keys(obj).sort((a, b) => new Date(a) - new Date(b));

  const sortedObj = {};
  sortedKeys.forEach((key) => {
    sortedObj[key] = obj[key];
  });

  return sortedObj;
}

async function sumFileFormats() {
  //   const allData = getJSON("./data/rawAll.json");
  //   const rawAll = JSON.parse(fs.readFileSync("./data/rawAll.json"));

  const data = await getJSON(
    "https://datenregister.berlin.de/api/3/action/package_search?start=0&rows=1000000"
  );

  data.result.results.forEach((res) => {
    const yearMonthUpdate = res.date_updated?.slice(0, 4);
    const yearMonthRelease = res.date_released?.slice(0, 4);

    const currentDate = new Date();
    const lastYear = currentDate.getFullYear() - 1;

    if (
      yearMonthUpdate < 2000 ||
      yearMonthRelease < 2000 ||
      yearMonthUpdate > lastYear ||
      yearMonthRelease > lastYear
    ) {
      return;
    }

    if (
      // release
      res.date_updated === res.date_released ||
      res.date_updated === undefined
    ) {
      if (!dates[yearMonthRelease]) {
        dates[yearMonthRelease] = { update: 0, release: 0 };
      }
      dates[yearMonthRelease].release = dates[yearMonthRelease].release + 1;
    } else {
      // update
      if (!dates[yearMonthUpdate]) {
        dates[yearMonthUpdate] = { update: 0, release: 0 };
      }
      dates[yearMonthUpdate].update = dates[yearMonthUpdate].update + 1;
    }
  });

  const sortedData = sortByDate(dates);

  const header = ["date"];
  const update = ["Updates"];
  const release = ["Neuerscheinungen"];

  for (const key in sortedData) {
    header.push(key);
    update.push(sortedData[key].update);
    release.push(sortedData[key].release);
  }

  let csv = header.toString() + "\n";
  csv += update.toString() + "\n";
  csv += release.toString() + "\n";

  console.log(csv);

  fs.writeFile(
    "./data/sumByDate.csv",
    csv,
    {
      encoding: "utf8",
    },
    (err) => {}
  );
}

sumFileFormats();
