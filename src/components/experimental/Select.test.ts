import { ref, Ref, defineComponent } from "vue";
import { render, within } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";
import Select from "./Select.vue";

// Type defs
type Options = string[] | { label: string; value: string }[];

interface SelectProps {
  options?: Options;
  value?: Ref<string>;
}

interface TestOptions {
  props?: SelectProps;
  attrs?: { onChange?(value: string): void };
}

// Note: Tests on styling are done within each individual test (if relevant) to prevent code duplication.
// Note: All tests outside the "Object Options" section should use string options only. Do not duplicate testing effort.
// Note: When attempting `keyboard` user events, the input must be in focus.
describe("Select", () => {
  const testLabel = "Test Label";
  const activeClass = "option--active";
  const testOptions = ["Ora", "Muda", "Ari", "Jojo"];

  // Helper Functions
  function getRandomOption<T extends Options>(options: T = testOptions as T): T[number] {
    const optionIndex = Math.floor(Math.random() * options.length);
    return options[optionIndex];
  }

  function renderComponent({ props, attrs }: TestOptions = {}) {
    const { options = testOptions, ...restProps } = { ...props };
    const { onChange } = { ...attrs };

    const container = document.createElement("div");

    const label = document.createElement("label");
    const selectId = "test-select";
    label.htmlFor = selectId;
    label.innerHTML = testLabel;

    document.body.appendChild(container);
    container.appendChild(label);

    return render(Select, {
      attrs: { id: selectId, onChange },
      props: { options, ...restProps },
      container,
      baseElement: document.body,
    });
  }

  /* -------------------- Mouse Tests -------------------- */
  it("Displays the options when in use ('focused via click')", async () => {
    const { queryByText, getByLabelText } = renderComponent();

    // No options should be present initially
    testOptions.forEach((o) => expect(queryByText(o)).not.toBeInTheDocument());

    // Focus the select by clicking it
    const search = getByLabelText(testLabel);
    await userEvent.click(search);
    testOptions.forEach((o) => expect(queryByText(o)).toBeInTheDocument());

    // De-focus the select by clicking outside the select
    await userEvent.click(document.body);
    testOptions.forEach((o) => expect(queryByText(o)).not.toBeInTheDocument());
  });

  it("Selects the option the user clicks and hides the dropdown", async () => {
    const { queryByText, getByLabelText } = renderComponent();

    const search = getByLabelText(testLabel) as HTMLInputElement;
    await userEvent.click(search);

    const option = getRandomOption() as string;
    const optionEl = queryByText(option) as HTMLElement;
    await userEvent.click(optionEl);

    expect(search.placeholder).toBe(option);
    testOptions.forEach((o) => expect(queryByText(o)).not.toBeInTheDocument());
  });

  /* -------------------- Keyboard Tests -------------------- */
  it("Displays the options when in use ('focused via tab')", async () => {
    const { queryByText } = renderComponent();

    // No options should be present initially
    testOptions.forEach((o) => expect(queryByText(o)).not.toBeInTheDocument());

    // Focus the select by tabbing to it
    await userEvent.tab();
    testOptions.forEach((o) => expect(queryByText(o)).toBeInTheDocument());

    // De-focus the select by tabbing out of it
    await userEvent.tab();
    testOptions.forEach((o) => expect(queryByText(o)).not.toBeInTheDocument());
  });

  it("It filters the options based on the input (case-insensitive)", async () => {
    const { getByLabelText, getByRole } = renderComponent();

    // Setup
    await userEvent.tab();
    const dropdown = getByRole("menu");
    const getAllOptions = () => within(dropdown).getAllByRole("option");
    const validateOptions = (filter: string) => {
      // First option should be highlighted
      expect(dropdown.firstElementChild).toHaveClass(activeClass);

      // Only filtered options should appear (case-insensitive)
      const pattern = new RegExp(filter, "i");
      testOptions.forEach((o) => {
        if (pattern.test(o)) expect(within(dropdown).queryByText(o)).toBeInTheDocument();
        else expect(within(dropdown).queryByText(o)).not.toBeInTheDocument();
      });
    };

    const search = getByLabelText(testLabel);
    const option = getRandomOption() as string;

    await userEvent.type(search, option);
    expect(getAllOptions()).toHaveLength(1);
    validateOptions(option);

    await userEvent.clear(search);
    await userEvent.type(search, "a");
    expect(getAllOptions().length).toBeGreaterThan(1);
    expect(getAllOptions().length).toBeLessThan(testOptions.length);
    validateOptions("a");
  });

  it("Selects the option the user submits and hides the dropdown", async () => {
    const { queryByText, getByLabelText } = renderComponent();

    const search = getByLabelText(testLabel) as HTMLInputElement;
    // Skip first option to avoid potential false positives from bad implementations
    const option = getRandomOption(testOptions.slice(1));

    await userEvent.type(search, option);
    expect(queryByText(option)).toHaveClass(activeClass);
    await userEvent.keyboard("{Enter}");

    expect(search.placeholder).toBe(option);
    expect(search).toHaveValue("");
    testOptions.forEach((o) => expect(queryByText(o)).not.toBeInTheDocument());
  });

  it("Navigates options using the 'ArrowUp'/'ArrowDown' keys", async () => {
    const { getByText, getByLabelText } = renderComponent();

    await userEvent.tab();
    const search = getByLabelText(testLabel) as HTMLInputElement;

    await userEvent.keyboard([...Array(testOptions.length)].map(() => "{ArrowDown}").join(""));
    const [lastOption] = testOptions.slice(-1);
    expect(getByText(lastOption)).toHaveClass(activeClass);

    await userEvent.keyboard("{ArrowUp}");
    const [secondToLastOption] = testOptions.slice(-2);
    expect(getByText(secondToLastOption)).toHaveClass(activeClass);
    expect(getByText(lastOption)).not.toHaveClass(activeClass);

    await userEvent.keyboard("{Enter}");
    expect(search.placeholder).toBe(secondToLastOption);
  });

  it("Clears its value when a deletion key is pressed without a filter", async () => {
    const { getByLabelText } = renderComponent();

    const search = getByLabelText(testLabel) as HTMLInputElement;

    // `Backspace`
    await userEvent.type(search, "A");
    await userEvent.clear(search);
    await userEvent.keyboard("{Enter}");
    expect(search.placeholder).toBe(testOptions[0]);
    await userEvent.tab();
    await userEvent.keyboard("{Backspace}");
    expect(search.placeholder).toBe("");

    // `Delete`
    await userEvent.keyboard("{Enter}");
    expect(search.placeholder).toBe(testOptions[0]);
    await userEvent.tab();
    await userEvent.keyboard("{Delete}");
    expect(search.placeholder).toBe("");
  });

  /* -------------------- Mouse-Keyboard-Mix Tests -------------------- */
  it("Selects the last hovered item on submission", async () => {
    const { getByText, getByLabelText } = renderComponent();

    const search = getByLabelText(testLabel) as HTMLInputElement;

    await userEvent.tab();
    // Skip first option to avoid potential false positives from bad implementations
    const option = getRandomOption(testOptions.slice(1));
    const optionEl = getByText(option);

    await userEvent.hover(optionEl);
    expect(optionEl).toHaveClass(activeClass);
    await userEvent.keyboard("{Enter}");

    expect(search.placeholder).toBe(option);
  });

  /* -------------------- Object Option Tests -------------------- */
  it("Works with an array of option objects", async () => {
    const objectOptions = testOptions.map((o) => ({ label: o, value: o.toLowerCase() }));
    const { getByText, getByLabelText } = renderComponent({ props: { options: objectOptions } });

    const search = getByLabelText(testLabel) as HTMLInputElement;
    // Skip first option to avoid potential false positives from bad implementations
    const option = getRandomOption(objectOptions.slice(1));

    await userEvent.type(search, option.label);
    expect(getByText(option.label)).toHaveClass(activeClass);
    await userEvent.keyboard("{Enter}");

    expect(search.placeholder).toBe(option.label);
  });

  /* -------------------- Props / V-Model Tests -------------------- */
  it("Works with v-model | Handles clearing properly", async () => {
    // Setup Wrapper and model properties
    const TestEnvironment = defineComponent({
      components: { Select },
      props: { options: { type: Array, default: () => testOptions } },
      setup: (props) => ({ testModel: ref(""), props }),
      template: `
        <label for="${testLabel}">${testLabel}</label>
        <Select id="${testLabel}" v-model="testModel" :options="props.options" />
      `,
    });

    // Run Main Test
    const { getByText, getByLabelText } = render(TestEnvironment);

    const search = getByLabelText(testLabel) as HTMLInputElement;
    const option = getRandomOption() as string;

    await userEvent.type(search, option);
    expect(getByText(option)).toHaveClass(activeClass);
    await userEvent.keyboard("{Enter}");

    expect(search.placeholder).toBe(option);

    // Run "Handles clearing properly" Test --> Needed after a discovered bug
    await userEvent.tab();
    await userEvent.keyboard("{Backspace}");
    expect(search.placeholder).toBe("");
  });

  it("Works with props | Handles clearing properly", async () => {
    // Setup props
    const value = ref("");
    const onChange = jest.fn((newValue: string) => (value.value = newValue));

    // Run Main Test
    const { getByText, getByLabelText } = renderComponent({
      props: { value },
      attrs: { onChange },
    });

    const search = getByLabelText(testLabel) as HTMLInputElement;
    const option = getRandomOption() as string;

    await userEvent.type(search, option);
    expect(getByText(option)).toHaveClass(activeClass);
    await userEvent.keyboard("{Enter}");

    expect(search.placeholder).toBe(option);
    expect(onChange).toHaveBeenCalled();

    // Run "Handles clearing properly" Test --> Needed after a discovered bug
    await userEvent.tab();
    await userEvent.keyboard("{Backspace}");
    expect(search.placeholder).toBe("");
  });
});
