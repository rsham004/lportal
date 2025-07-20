# Visual Asset Generation Plan

## 1. Objective
To create a cohesive and professional set of visual assets for the Learning Portal Platform that aligns with the "Modern & Clean" design philosophy outlined in the PRD. The visual style will be a blend of "Modern Minimal" and "Calm Professional" to create an experience that is clean, trustworthy, and engaging.

## 2. Asset Storage and Naming Convention
-   **Storage Location**: All generated images will be stored in the `/assets/` directory.
-   **Naming Convention**: Files will be named using a clear and descriptive convention to ensure they are easy to find and manage.
    -   Format: `[category]_[description]_[style].png`
    -   **Category**: `hero`, `icon`, `illustration`, `course_thumbnail`, `avatar`
    -   **Description**: A brief, one-or-two-word description of the image content (e.g., `data_science`, `user_profile`).
    -   **Style**: The visual style used (e.g., `minimal`, `professional`).
    -   **Example**: `hero_homepage_professional.png`, `icon_play_button_minimal.png`, `course_thumbnail_python_basics_minimal.png`

## 3. Usage in Next.js
To use these images in the Next.js application, import them directly into your components. This allows Next.js to process and optimize the images.
```jsx
import MyImage from '../../assets/hero_homepage_professional.png';

const MyComponent = () => {
  return <img src={MyImage.src} alt="Hero Image" />;
};
```

## 3. Image Generation Strategy
1.  **Foundation**: Generate a set of foundational assets, including the main logo and key icons. The detailed prompts for this are located in `/assets/image_prompts.md`.
2.  **Hero Images**: Create a primary hero image for the homepage and several secondary hero images for key landing pages (e.g., for instructors, for businesses).
3.  **Illustrations**: Develop a set of illustrations to be used throughout the site for empty states, success messages, and feature highlights. These should be consistent in style.
4.  **Course Thumbnails**: Generate a series of placeholder course thumbnails for different subjects (e.g., programming, design, business). These will establish a consistent visual language for the course catalog.
5.  **Avatars**: Create a set of default user avatars.

## 4. Implementation Plan
-   **[ ] Phase 1: Foundational Assets (Logo & Icons)**
    -   Generate the primary logo for the learning portal.
    -   Create a set of 10-15 essential UI icons (e.g., play, pause, profile, settings, search).
    -   Store all assets in `/assets/` with the correct naming convention.
-   **[ ] Phase 2: Hero Images & Illustrations**
    -   Generate the main homepage hero image.
    -   Create 3-5 supporting illustrations for key features or empty states.
    -   Ensure all hero images and illustrations share a consistent visual style.
-   **[ ] Phase 3: Course Thumbnails & Avatars**
    -   Generate 5-10 placeholder course thumbnails for various subjects.
    -   Create 5 default user avatars.
-   **[ ] Phase 4: Review and Refine**
    -   Review all generated assets for consistency and quality.
    -   Refine prompts and regenerate assets as needed.
    -   Document the final visual style guidelines in the main `README.md` or a new `DESIGN_GUIDE.md`.
