const axios = require("axios");
const fs = require("fs");
const { format } = require("fast-csv");

function convertTimestamp(timestamp) {
  // Create a new Date object using the timestamp
  const date = new Date(timestamp);

  // Extract day, month, and year
  const day = date.getDate(); // Day of the month
  const month = date.getMonth() + 1; // Month is 0-indexed in JavaScript, so add 1
  const year = date.getFullYear(); // Year

  // Format the date in "day month year" format
  return `${day}.${month}.${year}`;
}

function removeDuplicates(arr, key) {
  const uniqueValues = new Set();
  return arr.filter((item) => {
    const keyValue = item.data.package.title;
    if (uniqueValues.has(keyValue)) {
      // If the key value is already in the set, it's a duplicate - filter it out
      return false;
    }
    uniqueValues.add(keyValue);
    return true;
  });
}

async function downloadDataAndSaveToCSV(url, csvFilePath) {
  try {
    // Download the data
    const response = await axios.get(url);
    const data = response.data;

    // Extract the 'result' property
    let results = data.result;
    results = removeDuplicates(results);
    results.forEach((line) => {
      const title = line?.data?.package?.title
        ? line?.data?.package?.title
        : "";
      line.Datum = convertTimestamp(line.timestamp);
      const link =
        "https://daten.berlin.de/search/node/" +
        title.replace(/\s/g, "%20");
      line.Name = `<a href='${link}' target='_blank'>${title}</a>`;
      line.Art = line.activity_type === "changed package" ? "update" : "neu";

      delete line.activity_type;
      delete line.data;
      delete line.id;
      delete line.timestamp;
      delete line.user_id;
      delete line.object_id;
    });

    // Create a writable stream for the CSV file
    const csvStream = format({ headers: true });
    const writableStream = fs.createWriteStream(csvFilePath);

    writableStream.on("finish", () => {
      console.log(`Saved CSV to ${csvFilePath}`);
    });

    // Pipe the results to the CSV stream and then to the file
    csvStream.pipe(writableStream);
    results.forEach((result) => csvStream.write(result));
    csvStream.end();
  } catch (error) {
    console.error("Error:", error);
  }
}

// URL of your dataset
const url =
  "https://datenregister.berlin.de/api/3/action/recently_changed_packages_activity_list";

// Path to save the CSV file
const csvFilePath = "./data/ckan-updates.csv";

downloadDataAndSaveToCSV(url, csvFilePath);
