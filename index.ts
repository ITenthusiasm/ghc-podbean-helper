/* eslint-disable */
// Will be refactored with standardized usage later.

import { Promise as NodeID3 } from "node-id3";

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
