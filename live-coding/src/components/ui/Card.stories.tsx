import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from './Button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Simple: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardContent>
        <p>A simple card with just content.</p>
      </CardContent>
    </Card>
  ),
};

export const WithoutFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Learning Module</CardTitle>
        <CardDescription>Introduction to React Components</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This module covers the basics of React components, including props, state, and lifecycle methods.</p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm">Duration: 45 minutes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Difficulty: Beginner</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const CourseCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Advanced JavaScript</CardTitle>
        <CardDescription>Master modern JavaScript concepts and patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>75%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>12 of 16 lessons</span>
            <span>3h 20m remaining</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Review</Button>
        <Button>Continue</Button>
      </CardFooter>
    </Card>
  ),
};

export const ProfileCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
            JD
          </div>
          <div>
            <CardTitle className="text-lg">John Doe</CardTitle>
            <CardDescription>Full Stack Developer</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Courses Completed</span>
            <span className="font-semibold">24</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Hours Learned</span>
            <span className="font-semibold">156h</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Certificates</span>
            <span className="font-semibold">8</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Profile</Button>
      </CardFooter>
    </Card>
  ),
};

export const NotificationCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">New Assignment</CardTitle>
          <span className="text-xs text-muted-foreground">2 hours ago</span>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-3">
          Your instructor has posted a new assignment for "Web Development Fundamentals"
        </CardDescription>
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm font-medium">Assignment: Build a Responsive Landing Page</p>
          <p className="text-xs text-muted-foreground mt-1">Due: Friday, July 25th at 11:59 PM</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">Dismiss</Button>
        <Button size="sm">View Assignment</Button>
      </CardFooter>
    </Card>
  ),
};