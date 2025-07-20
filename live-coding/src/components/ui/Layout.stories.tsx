import type { Meta, StoryObj } from '@storybook/react';
import { Container, Grid, GridItem, Stack, Flex, Box } from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

const meta: Meta<typeof Container> = {
  title: 'UI/Layout',
  component: Container,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component for demonstration
const DemoCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Card className={className}>
    <CardContent className="p-4">
      <div className="bg-primary/10 rounded p-4 text-center">
        {children}
      </div>
    </CardContent>
  </Card>
);

export const ContainerSizes: Story = {
  render: () => (
    <div className="space-y-8 p-4">
      <Container size="sm">
        <DemoCard>Small Container (max-w-screen-sm)</DemoCard>
      </Container>
      <Container size="md">
        <DemoCard>Medium Container (max-w-screen-md)</DemoCard>
      </Container>
      <Container size="lg">
        <DemoCard>Large Container (max-w-screen-lg)</DemoCard>
      </Container>
      <Container size="xl">
        <DemoCard>Extra Large Container (max-w-screen-xl)</DemoCard>
      </Container>
      <Container size="2xl">
        <DemoCard>2XL Container (max-w-screen-2xl)</DemoCard>
      </Container>
      <Container size="full">
        <DemoCard>Full Width Container</DemoCard>
      </Container>
    </div>
  ),
};

export const GridLayouts: Story = {
  render: () => (
    <Container className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">2 Column Grid</h3>
        <Grid cols={2} gap={4}>
          <DemoCard>Item 1</DemoCard>
          <DemoCard>Item 2</DemoCard>
          <DemoCard>Item 3</DemoCard>
          <DemoCard>Item 4</DemoCard>
        </Grid>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">3 Column Grid</h3>
        <Grid cols={3} gap={4}>
          <DemoCard>Item 1</DemoCard>
          <DemoCard>Item 2</DemoCard>
          <DemoCard>Item 3</DemoCard>
          <DemoCard>Item 4</DemoCard>
          <DemoCard>Item 5</DemoCard>
          <DemoCard>Item 6</DemoCard>
        </Grid>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">4 Column Grid</h3>
        <Grid cols={4} gap={4}>
          <DemoCard>Item 1</DemoCard>
          <DemoCard>Item 2</DemoCard>
          <DemoCard>Item 3</DemoCard>
          <DemoCard>Item 4</DemoCard>
        </Grid>
      </div>
    </Container>
  ),
};

export const ResponsiveGrid: Story = {
  render: () => (
    <Container>
      <h3 className="text-lg font-semibold mb-4">Responsive Grid (1 → 2 → 3 → 4 columns)</h3>
      <Grid cols={1} mdCols={2} lgCols={3} xlCols={4} gap={4}>
        <DemoCard>Course 1</DemoCard>
        <DemoCard>Course 2</DemoCard>
        <DemoCard>Course 3</DemoCard>
        <DemoCard>Course 4</DemoCard>
        <DemoCard>Course 5</DemoCard>
        <DemoCard>Course 6</DemoCard>
        <DemoCard>Course 7</DemoCard>
        <DemoCard>Course 8</DemoCard>
      </Grid>
    </Container>
  ),
};

export const GridWithSpanning: Story = {
  render: () => (
    <Container>
      <h3 className="text-lg font-semibold mb-4">Grid with Column Spanning</h3>
      <Grid cols={4} gap={4}>
        <GridItem colSpan={2}>
          <DemoCard>Spans 2 columns</DemoCard>
        </GridItem>
        <DemoCard>Item 1</DemoCard>
        <DemoCard>Item 2</DemoCard>
        <GridItem colSpan="full">
          <DemoCard>Spans full width</DemoCard>
        </GridItem>
        <DemoCard>Item 3</DemoCard>
        <GridItem colSpan={3}>
          <DemoCard>Spans 3 columns</DemoCard>
        </GridItem>
      </Grid>
    </Container>
  ),
};

export const StackLayouts: Story = {
  render: () => (
    <Container className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Vertical Stack</h3>
        <Stack spacing={4}>
          <DemoCard>Item 1</DemoCard>
          <DemoCard>Item 2</DemoCard>
          <DemoCard>Item 3</DemoCard>
        </Stack>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Horizontal Stack</h3>
        <Stack direction="horizontal" spacing={4}>
          <DemoCard>Item 1</DemoCard>
          <DemoCard>Item 2</DemoCard>
          <DemoCard>Item 3</DemoCard>
        </Stack>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Centered Stack</h3>
        <Stack align="center" spacing={4}>
          <DemoCard className="w-32">Small</DemoCard>
          <DemoCard className="w-48">Medium</DemoCard>
          <DemoCard className="w-64">Large</DemoCard>
        </Stack>
      </div>
    </Container>
  ),
};

export const FlexLayouts: Story = {
  render: () => (
    <Container className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Flex Row with Space Between</h3>
        <Flex justify="between" align="center" className="p-4 border rounded">
          <DemoCard>Left</DemoCard>
          <DemoCard>Center</DemoCard>
          <DemoCard>Right</DemoCard>
        </Flex>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Flex Column with Gap</h3>
        <Flex direction="col" gap={4}>
          <DemoCard>Item 1</DemoCard>
          <DemoCard>Item 2</DemoCard>
          <DemoCard>Item 3</DemoCard>
        </Flex>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Flex Wrap</h3>
        <Flex wrap="wrap" gap={4}>
          <DemoCard className="w-32">Item 1</DemoCard>
          <DemoCard className="w-32">Item 2</DemoCard>
          <DemoCard className="w-32">Item 3</DemoCard>
          <DemoCard className="w-32">Item 4</DemoCard>
          <DemoCard className="w-32">Item 5</DemoCard>
          <DemoCard className="w-32">Item 6</DemoCard>
        </Flex>
      </div>
    </Container>
  ),
};

export const BoxSpacing: Story = {
  render: () => (
    <Container className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Box with Padding</h3>
        <Box p={8} className="border rounded">
          <DemoCard>Content with padding</DemoCard>
        </Box>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Box with Margin</h3>
        <div className="border rounded">
          <Box m={8}>
            <DemoCard>Content with margin</DemoCard>
          </Box>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Box with Mixed Spacing</h3>
        <Box px={6} py={4} mx={2} className="border rounded">
          <DemoCard>px-6 py-4 mx-2</DemoCard>
        </Box>
      </div>
    </Container>
  ),
};

export const CourseGridExample: Story = {
  render: () => (
    <Container>
      <h2 className="text-2xl font-bold mb-6">Course Catalog</h2>
      <Grid cols={1} mdCols={2} lgCols={3} gap={6}>
        <Card>
          <CardHeader>
            <CardTitle>React Fundamentals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Learn the basics of React including components, props, and state.
            </p>
            <div className="flex justify-between text-sm">
              <span>Beginner</span>
              <span>8 hours</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced JavaScript</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Master advanced JavaScript concepts and modern ES6+ features.
            </p>
            <div className="flex justify-between text-sm">
              <span>Advanced</span>
              <span>12 hours</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Node.js Backend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Build scalable backend applications with Node.js and Express.
            </p>
            <div className="flex justify-between text-sm">
              <span>Intermediate</span>
              <span>10 hours</span>
            </div>
          </CardContent>
        </Card>

        <GridItem colSpan={2}>
          <Card>
            <CardHeader>
              <CardTitle>Full Stack Development Bootcamp</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Complete full stack development course covering frontend, backend, and database technologies.
              </p>
              <div className="flex justify-between text-sm">
                <span>All Levels</span>
                <span>40 hours</span>
              </div>
            </CardContent>
          </Card>
        </GridItem>

        <Card>
          <CardHeader>
            <CardTitle>Database Design</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Learn database design principles and SQL optimization.
            </p>
            <div className="flex justify-between text-sm">
              <span>Intermediate</span>
              <span>6 hours</span>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Container>
  ),
};