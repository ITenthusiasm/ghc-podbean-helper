const NodeID3 = require("node-id3").Promise;

async function readTags() {
  const path = "./local-audio-test.mp3";
  const tags = await NodeID3.read(path);
  console.log("Before: ");
  console.log(tags);

  const newTags: import("node-id3").Tags = {
    title: "How to eat onions",
    genre: "Turkey",
  };

  await NodeID3.update(newTags, path);
  const updatedTags = await NodeID3.read(path);
  console.log("After: ");
  console.log(updatedTags);
}

readTags();
