<template>
  <div class="select" v-on="selectHandlers">
    <input
      :id="$attrs.id"
      :ref="(el) => (search.element = el)"
      v-model="search.value"
      type="text"
      autocomplete="off"
      v-on="searchHandlers"
    />

    <div v-if="showOptions" :ref="(el) => (select.dropdown = el)" class="dropdown" role="menu">
      <div
        v-for="(option, i) in filteredOptions"
        :key="option.value || option"
        :class="[i === activeOption ? 'option--active' : 'option']"
        role="option"
        v-on="optionHandlers"
      >
        {{ option.label || option }}
      </div>

      <div v-if="!filteredOptions.length" class="no-options">No options :(</div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  toRef,
  toRefs,
  computed,
  watch,
  onMounted,
  PropType,
} from "vue";

type OptionObject = { label: string; value: string };
type Options = string[] | OptionObject[];

export default defineComponent({
  name: "Select",
  inheritAttrs: false,
  props: {
    options: { type: Array as PropType<Options>, default: () => [] },
    modelValue: { type: String, default: undefined },
    value: { type: String, default: undefined },
  },
  emits: ["change", "update:modelValue"],
  setup(props, { emit }) {
    /* -------------------- Initial Setup -------------------- */
    const valueIsControlled = props.modelValue != null || props.value != null;

    /** Determines whether to use `modelValue` or `value` as a prop. */
    const getValueProp = (() => {
      const useVModel = props.modelValue != null;
      const useProp = props.value != null;

      if (useVModel && useProp) {
        // eslint-disable-next-line no-console
        console.warn("Warning: `value` will be ignored when `modelValue` is used");
      }

      if (useVModel) return () => props.modelValue;
      return () => props.value;
    })();

    /* -------------------- State -------------------- */
    // Search
    const search = reactive({
      element: null as HTMLInputElement | null,
      value: "",
    });

    onMounted(() => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Unavoidable
      if (valueIsControlled && selectValueIsValid(getValueProp()))
        search.element!.placeholder = getValueProp() as string;
    });

    // Select
    const select = reactive({
      dropdown: null as HTMLDivElement | null,
      value: "",
      activeOption: -1,
      showOptions: false,
      filteredOptions: computed(() => {
        const lowercaseSearch = search.value.toLowerCase();

        return (props.options as unknown[]).filter((o) => {
          if (typeof o === "string") return o.toLowerCase().includes(lowercaseSearch);

          return (o as OptionObject).label.toLowerCase().includes(lowercaseSearch);
        }) as Options;
      }),
    });

    /* -------------------- Effects -------------------- */
    watch([toRef(select, "value"), toRef(props, "value"), toRef(props, "modelValue")], () => {
      if (valueIsControlled) {
        const valueProp = getValueProp() as string;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Unavoidable
        if (selectValueIsValid(valueProp)) search.element!.placeholder = valueProp;
        return;
      }

      if (select.value === "") search.element!.placeholder = select.value;
      else if (typeof props.options[0] === "string") search.element!.placeholder = select.value;
      else {
        const { filteredOptions } = select as { filteredOptions: OptionObject[] };
        const option = filteredOptions.find((o) => o.value === select.value) as OptionObject;
        search.element!.placeholder = option.label;
      }
    });

    watch(toRef(select, "filteredOptions"), () => (select.activeOption = 0));

    /* -------------------- Helper Functions -------------------- */
    // Note: The internal `select.value` will always be valid and never needs to be checked.
    function selectValueIsValid(value: string | undefined): boolean {
      if (value === undefined) return false;
      if (value === "") return true;

      return select.filteredOptions.some((o) => {
        const filteredValue = typeof o === "string" ? o : o.value;
        return value === filteredValue;
      });
    }

    /** Sets the component's value to the provided `option` */
    function choose(option: Options[number]) {
      const value = typeof option === "string" ? option : option.value;
      emit("change", value);
      emit("update:modelValue", value);
      if (!valueIsControlled) select.value = value;

      search.value = "";
      search.element?.blur();
    }

    function adjustScroll() {
      if (!select.dropdown) return;

      const optionEl = select.dropdown.children[select.activeOption] as HTMLElement | undefined;

      if (optionEl) {
        const bounds = select.dropdown.getBoundingClientRect();
        const { top, bottom, height } = optionEl.getBoundingClientRect();

        if (top < bounds.top) {
          select.dropdown.scrollTop = optionEl.offsetTop;
        } else if (bottom > bounds.bottom) {
          select.dropdown.scrollTop = optionEl.offsetTop - (bounds.height - height);
        }
      }
    }

    function getOptionIndex(option: HTMLElement): number {
      const options = Array.from(select.dropdown!.children);
      return options.findIndex((o) => o === option);
    }

    /* --------------- Registered handlers for elements --------------- */
    const searchHandlers = {
      focus: () => (select.showOptions = true),
      blur() {
        select.showOptions = false;
        search.value = "";
      },
      keydown(event: KeyboardEvent) {
        // Selecting a value
        if (event.key === "Enter") {
          event.preventDefault();
          if (!select.filteredOptions.length) return;

          choose(select.filteredOptions[select.activeOption]);
        }
        // Clearing a value
        else if (["Backspace", "Delete"].includes(event.key) && !search.value) {
          const value = "";

          emit("change", value);
          emit("update:modelValue", value);
          if (!valueIsControlled) select.value = value;
        }
        // Move cursor up
        else if (event.key === "ArrowUp") {
          select.activeOption = Math.max(0, select.activeOption - 1);
          adjustScroll();
        }
        // Move cursor down
        else if (event.key === "ArrowDown") {
          select.activeOption = Math.min(
            select.filteredOptions.length - 1,
            select.activeOption + 1
          );
          adjustScroll();
        }
      },
    };

    const selectHandlers = {
      mousedown(event: MouseEvent) {
        if (event.target !== search.element) event.preventDefault();
      },
    };

    const optionHandlers = {
      mouseover(event: MouseEvent & { target: HTMLDivElement }) {
        select.activeOption = getOptionIndex(event.target);
      },
      click(event: MouseEvent & { target: HTMLDivElement }) {
        const option = select.filteredOptions[getOptionIndex(event.target)];
        choose(option);
      },
    };

    return {
      // State
      search,
      select,
      ...toRefs(select),

      // Handlers
      searchHandlers,
      selectHandlers,
      optionHandlers,
    };
  },
});
</script>

<style lang="scss" scoped>
.select {
  position: relative;
  display: inline-block;

  & > input[type="text"] {
    &:not(:focus)::placeholder {
      color: black;
    }
  }

  & > .dropdown {
    position: absolute;
    z-index: 2;

    border: 2px solid #42424242;
    border-radius: 5px;
    margin-top: -4px;

    width: 100%;
    box-sizing: border-box;
    max-height: 190px;
    overflow: auto;

    background-color: white;
    text-align: left;

    & > .option {
      cursor: pointer;
      padding: 8px;

      &--active {
        @extend .option;
        color: white;
        background-color: #2684ff;
      }
    }

    & > div.no-options {
      text-align: center;
      padding: 8px;
    }
  }
}
</style>
