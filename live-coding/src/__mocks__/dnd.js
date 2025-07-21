// Mock for @hello-pangea/dnd
module.exports = {
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: () => {},
  }),
  Draggable: ({ children }) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: () => {},
  }),
};