# React 18 Documentation Overview

## What is React?

React is a JavaScript library for building user interfaces. It lets you create interactive UIs by building components that manage their own state and compose them to make complex UIs.

## Core Concepts

### Components
- **Function Components**: JavaScript functions that return JSX
- **Component Composition**: Nesting components to build complex UIs
- **Props**: Data passed from parent to child components
- **Component Names**: Must start with capital letter

### JSX (JavaScript XML)
- **Markup in JavaScript**: Write HTML-like syntax in JavaScript
- **Stricter than HTML**: Must close all tags, wrap multiple elements
- **JavaScript Expressions**: Use curly braces `{}` to embed JavaScript
- **Attributes**: Use `className` instead of `class`, camelCase for attributes

### State Management
- **useState Hook**: Add state to functional components
- **State Variables**: Store component data that can change
- **State Updates**: Use setter functions to update state
- **Lifting State Up**: Move state to common parent for sharing

### Event Handling
- **Event Handlers**: Functions that respond to user interactions
- **onClick, onChange**: Common event handlers
- **Passing Functions**: Pass event handlers as props
- **Event Object**: Access event details in handler functions

## React 18 Features

### Concurrent Features
- **Automatic Batching**: Batch multiple state updates for better performance
- **Transitions**: Mark updates as non-urgent for better UX
- **Suspense**: Handle loading states declaratively
- **Concurrent Rendering**: Interruptible rendering for better responsiveness

### New Hooks
- **useId**: Generate unique IDs for accessibility
- **useTransition**: Mark state updates as transitions
- **useDeferredValue**: Defer expensive calculations
- **useSyncExternalStore**: Subscribe to external data sources
- **useInsertionEffect**: Insert styles before DOM mutations

### Strict Mode Enhancements
- **Double Rendering**: Components render twice in development
- **Effect Cleanup**: Better detection of missing cleanup functions
- **Deprecated API Warnings**: Warnings for outdated patterns

## Component Patterns

### Conditional Rendering
```javascript
// Using ternary operator
{isLoggedIn ? <AdminPanel /> : <LoginForm />}

// Using logical AND
{isLoggedIn && <AdminPanel />}

// Using if statements
let content;
if (isLoggedIn) {
  content = <AdminPanel />;
} else {
  content = <LoginForm />;
}
```

### List Rendering
```javascript
const items = products.map(product =>
  <li key={product.id}>
    {product.title}
  </li>
);
```

### State Management
```javascript
const [count, setCount] = useState(0);

function handleClick() {
  setCount(count + 1);
}
```

## Hooks Rules

1. **Only call Hooks at the top level**: Don't call Hooks inside loops, conditions, or nested functions
2. **Only call Hooks from React functions**: Call from React function components or custom Hooks
3. **Custom Hooks**: Functions that start with "use" and call other Hooks

## Built-in Hooks

### State Hooks
- **useState**: Add state to components
- **useReducer**: Manage complex state logic
- **useContext**: Subscribe to React context

### Effect Hooks
- **useEffect**: Perform side effects
- **useLayoutEffect**: Fire synchronously after DOM mutations
- **useInsertionEffect**: Insert styles before DOM mutations

### Performance Hooks
- **useMemo**: Memoize expensive calculations
- **useCallback**: Memoize functions
- **useTransition**: Mark updates as non-urgent
- **useDeferredValue**: Defer expensive updates

### Ref Hooks
- **useRef**: Reference DOM elements or store mutable values
- **useImperativeHandle**: Customize ref exposure

## Best Practices

1. **Component Design**
   - Keep components small and focused
   - Use composition over inheritance
   - Extract reusable logic into custom hooks

2. **State Management**
   - Lift state up when sharing between components
   - Use local state when possible
   - Consider state structure carefully

3. **Performance**
   - Use React.memo for expensive components
   - Optimize re-renders with useMemo and useCallback
   - Use keys properly in lists

4. **Accessibility**
   - Use semantic HTML elements
   - Provide proper ARIA attributes
   - Ensure keyboard navigation works

5. **Error Handling**
   - Use Error Boundaries for component errors
   - Handle async errors properly
   - Provide fallback UIs

## Development Tools

- **React Developer Tools**: Browser extension for debugging
- **Strict Mode**: Development mode for finding problems
- **Profiler**: Performance profiling tool
- **ESLint Plugin**: Code quality and best practices

## Testing

- **React Testing Library**: Test components behavior
- **Jest**: JavaScript testing framework
- **Enzyme**: Alternative testing utility
- **User Event**: Simulate user interactions