## ActionSelectorModal Component

**Description:**
The `ActionSelectorModal` is a reusable React component based on `react-bootstrap`. It displays a modal dialog with a configurable set of action buttons. Each button can be configured with its own behavior, styling, and navigation link. This component is designed to be flexible and can be used in any part of the application where a modal with multiple action buttons is needed.

**Props:**

- `show` (boolean): Controls the visibility of the modal. `true` shows the modal, `false` hides it.
- `onHide` (function): A function that is called to close the modal. It should handle the logic to set the `show` prop to `false`.
- `title` (string): The title of the modal, displayed at the top.
- `buttonOptions` (array): An array of objects representing the buttons to be displayed. Each object can have the following properties:
  - `text` (string): The text displayed on the button.
  - `handler` (function): A function to execute when the button is clicked. This function should handle any cleanup or state updates necessary before the modal is closed or the app navigates away.
  - `href` (string): The navigation URL that the button links to, used with the Next.js `Link` component for client-side routing.
  - `variant` (string): A Bootstrap button variant to style the button (e.g., 'primary', 'success', 'info').
  - `backgroundColor` (string): The background color of the button.
  - `borderColor` (string): The color of the button border.
  - `textColor` (string): The color of the text on the button.

**Usage:**

```jsx
<ActionSelectorModal
  show={modalVisible}
  onHide={closeModal}
  title="Choose Your Action"
  buttonOptions={[
    {
      text: "First Action",
      handler: firstActionHandler,
      href: "/first-action-path",
      variant: "success",
      backgroundColor: "#00D1B2",
      borderColor: "#00D1B2",
      textColor: "white"
    },
    {
      text: "Second Action",
      handler: secondActionHandler,
      href: "/second-action-path",
      variant: "warning",
      backgroundColor: "#F2C037",
      borderColor: "#F2C037",
      textColor: "black"
    }
  ]}
/>
```

**When to Use:**

Use the `ActionSelectorModal` when you need a modal with multiple action buttons, each potentially performing different actions. This is particularly useful in scenarios where the user must choose from several options before proceeding, such as selecting a specific workflow in a multi-step process or confirming a choice among several alternatives.

This component abstracts away the modal structure and button handling, making it easy to reuse across different parts of your application without rewriting modal logic or styling.
