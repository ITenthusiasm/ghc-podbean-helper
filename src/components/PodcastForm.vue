<template>
  <h1 class="title">Grace Harbor Sermon Upload</h1>

  <form autocomplete="off" @submit.prevent="handleSubmit">
    <h2 class="form-section">Sermon Details</h2>

    <div class="changeable-input">
      <label for="speaker">Speaker</label>
      <label>
        <input v-model="speaker.new" type="checkbox" />
        New
      </label>
    </div>

    <Select v-if="!speaker.new" id="speaker" v-model="speaker.value" :options="speakers" />
    <template v-else>
      <input v-model="speaker.firstName" type="text" placeholder="First Name" />
      <input v-model="speaker.lastName" type="text" placeholder="Last Name" />
    </template>
    <br />

    <label for="title">Sermon Title</label>
    <input id="title" v-model="title" type="text" />

    <div class="changeable-input">
      <label for="series">Series</label>
      <label>
        <input v-model="series.new" type="checkbox" />
        New
      </label>
    </div>

    <Select v-if="!series.new" id="series" v-model="series.value" :options="seriesOpts" />
    <input v-else id="series" v-model="series.newValue" type="text" />

    <fieldset>
      <legend>Reference</legend>
      <Select v-model="reference.book" :options="bibleBooks" />
      <input v-model="reference.passage" type="text" placeholder="Passage (eg. 1:2-2:20)" />
    </fieldset>

    <label for="date">Date</label>
    <input id="date" v-model="date" type="date" />

    <fieldset>
      <legend>Time</legend>

      <label class="radio-label">
        <input v-model="time" type="radio" value="Sunday Morning" />
        Sunday Morning
      </label>
      <label class="radio-label">
        <input v-model="time" type="radio" value="Sunday Evening" />
        Sunday Evening
      </label>
      <label class="radio-label">
        <input v-model="time" type="radio" value="Other" />
        Other
      </label>
    </fieldset>

    <h2 class="form-section">Files</h2>

    <div class="files">
      <div class="sermon">
        <label for="file" class="upload-button" v-bind="labelProps" v-on="labelHandlers">
          Upload Sermon
        </label>
        <div v-if="sermonFile.name" class="sermon-file-name">{{ sermonFile.name }}</div>
        <input id="file" type="file" accept="audio/mp3" @change="handleFileChange" />
      </div>

      <div class="thumbnail">
        <input
          id="thumbnail"
          type="file"
          accept="image/png"
          :disabled="!series.new"
          @change="handlePicChange"
        />
        <label for="thumbnail" class="upload-button" title="For new series only">
          Upload Thumbnail
        </label>
        <img
          src="https://graceharbor.gitlab.io/sermon-upload/img/ghc_podcast_logo.png"
          :alt="sermonPic.name"
        />
      </div>
    </div>

    <button>Submit</button>
    <button disabled>Trash</button>
  </form>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from "vue";
import axios from "axios";
import type { AxiosError } from "axios";
import Select from "@/components/experimental/Select.vue";
import { speakers, series as seriesOpts, bibleBooks } from "../../server/json-data";
import { SermonFormData } from "../../server/types";

export default defineComponent({
  name: "PodcastForm",
  components: { Select },
  setup() {
    // Setup
    const today = new Date();
    let initialTime: "Sunday Morning" | "Sunday Evening" | "Other";

    if (today.getDay() === 0) {
      if (today.getHours() < 16) initialTime = "Sunday Morning";
      else initialTime = "Sunday Evening";
    } else {
      initialTime = "Other";
    }

    // State
    const form = reactive({
      speaker: { new: false, value: "", firstName: "", lastName: "" },
      title: "",
      series: { new: false, value: "", newValue: "" },
      reference: { book: "Genesis", passage: "" },
      date: today.toISOString().split("T")[0] as SermonFormData["date"],
      time: initialTime,
      sermonFile: {} as File,
      sermonPic: {} as File,
    });

    // Handlers
    function handleFileChange(event: Event) {
      [form.sermonFile] = (event.target as HTMLInputElement).files as FileList;
    }

    function handlePicChange(event: Event) {
      [form.sermonPic] = (event.target as HTMLInputElement).files as FileList;
      console.log(form.sermonPic);
    }

    async function handleSubmit() {
      console.log(form);

      const sermonInfo: SermonFormData = Object.assign(form, {
        sermonFileName: form.sermonFile.name,
        sermonPicName: form.sermonPic.name,
      });

      console.log("Submitted Data: ", sermonInfo);

      try {
        await axios.post("/api/upload", sermonInfo);
      } catch (err) {
        const { response } = err as Required<AxiosError>;

        if (response.status === 400) {
          console.log(response.data);
          console.error(err);
        }
      }
    }

    // Object to treat labels like buttons
    const labelProps = {
      role: "button",
      tabindex: "0",
    };

    const labelHandlers = {
      keydown: (event: KeyboardEvent) => {
        if ([" ", "Enter"].includes(event.key)) {
          event.preventDefault();
          (event.target as HTMLElement).click();
        }
      },
    };

    return {
      ...toRefs(form),
      speakers,
      seriesOpts,
      bibleBooks,
      labelProps,
      labelHandlers,
      handleFileChange,
      handlePicChange,
      handleSubmit,
    };
  },
});
</script>

<style lang="scss" scoped>
h1.title {
  text-align: center;
}

form {
  padding: 0 16px;

  & > h2.form-section {
    border-bottom: 2px solid var(--color);
    margin: 20 0 16px;
  }

  & > div.changeable-input {
    display: flex;
    justify-content: space-between;
    width: 245px; // Width of input + padding + border ("border-box")
  }

  & > label + input[type="text"],
  & > label + input[type="date"] {
    display: block;
  }

  input {
    &[type="file"] {
      display: none;
    }

    &[type="text"],
    &[type="date"] {
      margin-right: 20px;
      margin-bottom: 20px;
    }
  }

  .select {
    margin: 4px 20px 20px 0;
  }

  fieldset {
    input[type="text"],
    input[type="date"],
    .select {
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  /* -------------------- Experimental -------------------- */
  & > .files {
    display: grid;
    grid-gap: 16px;
    grid-template-columns: 1fr 1fr;

    justify-items: center;
    align-items: flex-start;
    text-align: center;

    label.upload-button {
      padding: 6px 12px;
      border: 1px solid #ccc;
      border-radius: 5px;
      margin-bottom: 20px;

      width: 160px;
      display: inline-block;
      cursor: pointer;
    }

    & > .sermon {
      & > .sermon-file-name {
        padding: 8px;
        border: 2px solid black;
        border-radius: 5px;
        margin: 4px 0;
        margin-bottom: 20px;
      }
    }

    & > .thumbnail {
      & > label {
        display: block;
        transition: all 0.5s ease-in-out;
      }

      & > input:disabled + label {
        cursor: not-allowed;

        // Tinker with these
        border: 1px solid #999999;
        background-color: #cccccc;
        color: #666666;
      }

      & > img {
        border: 2px solid black;
        border-radius: 5px;
        max-width: 100px;
      }
    }
  }
}
</style>
