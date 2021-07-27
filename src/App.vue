<template>
  <PodcastForm />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PodcastForm from "@/components/PodcastForm.vue";

export default defineComponent({
  name: "App",
  components: { PodcastForm },
});
</script>

<style lang="scss">
:root {
  --color: #2c3e50;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--color);
  margin-top: 60px;
}

input[type="text"] {
  width: 225px;
  padding: 8px;
  border: 2px solid #42424242;
  border-radius: 5px;
  margin: 4px 0;
  font-size: 1rem;
  background: white;
  display: inline-block;
  outline: none;
  box-shadow: inset 0 1px 2px rgba(27, 31, 35, 0.075);

  &:focus {
    border-color: #2188ff;
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.3);
  }
}

input[type="date"] {
  @extend input, [type="text"];
  padding: 5.4px 8px; // Trying to get height close to text inputs
}

fieldset {
  padding: 0;
  border: 0;
  margin: auto auto 20px;

  & > legend {
    margin-bottom: 4px;
  }

  & > label.radio-label {
    margin-right: 20px;
  }
}
</style>
