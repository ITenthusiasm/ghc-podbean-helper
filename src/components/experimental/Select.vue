<!-- INCOMPLETE!
  Last stuck trying to figure out how to blur the input **while**
  setting the input's value to the current selected value. (The problem
  is that the blur event seems to fire first... which means the options vanish too soon)
-->

<template>
  <div class="select-wrapper">
    <input ref="input" v-model="search" type="text" v-on="inputHandlers" />

    <div v-show="showOptions" class="option-group">
      <div
        v-for="option in filteredOptions"
        :key="option.value || option"
        role="option"
        @click="choose(option)"
      >
        {{ option.label || option }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from "vue";

type OptionObject = { label: "string"; value: "string" };
type Options = string[] | OptionObject[];

export default defineComponent({
  name: "Select",
  props: {
    options: { type: Array as PropType<Options>, default: () => [] },
  },
  setup(props) {
    const input = ref<HTMLInputElement>();
    const search = ref("");
    const showOptions = ref(false);
    const selected = ref<string | OptionObject>("");

    const filteredOptions = computed(() => {
      const lowercaseSearch = search.value.toLowerCase();

      return (props.options as unknown[]).filter((o) => {
        if (typeof o === "string")
          return o.toLowerCase().includes(lowercaseSearch);

        return (o as OptionObject).label
          .toLowerCase()
          .includes(lowercaseSearch);
      }) as Options;
    });

    function choose(option: Options[number]) {
      search.value = typeof option === "string" ? option : option.label;
      selected.value = option;

      showOptions.value = false;
    }

    const inputHandlers = {
      focus: () => (showOptions.value = true),
    };

    return {
      search,
      input,
      filteredOptions,
      choose,
      showOptions,
      inputHandlers,
    };
  },
});
</script>

<style lang="scss" scoped>
select {
  display: none;
}

.select-wrapper {
  position: relative;
  display: inline-block;
}

.option-group {
  position: absolute;
  z-index: 2;

  border: 2px solid #42424242;
  border-radius: 5px;
  margin-top: -0.25rem;

  width: 100%;
  box-sizing: border-box;
  max-height: 11.875rem;
  overflow: auto;

  background-color: white;
  cursor: pointer;
  text-align: left;
}

div[role="option"] {
  padding: 0.5rem;

  &:hover {
    background-color: dodgerblue;
  }
}
</style>
