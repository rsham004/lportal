# Image Generation Prompts for Learning Portal

## Instructions
Use these prompts with a high-fidelity image generation model (e.g., Midjourney, DALL-E 3) to create visual assets for the Learning Portal Platform. The desired style is a blend of **Modern Minimal** and **Calm Professional**: clean, trustworthy, and engaging, with a focus on clarity and simplicity.

**Primary Colors**:
- Professional Blue: `#2563EB`
- Neutral Gray: `#F9FAFB` to `#111827`

---

### 1. Logos

-   **`logo_primary_minimal.png`**:
    -   **Usage Location**: `/live-coding/src/components/shared/Header.tsx` (and as favicon in `layout.tsx`)
    > "A minimalist logo for an online learning platform called 'LPortal'. The logo should be clean, modern, and professional. Use the primary color #2563EB. The design should be abstract and geometric, perhaps incorporating a stylized 'L' and 'P'. It needs to be simple enough to work at small sizes as a favicon. White background."

---

### 2. Icons (Style: Minimal)

### 2. Icons (Style: Minimal)
-   **Usage Location**: Imported as needed into various components in `/live-coding/src/components/`.
-   **`icon_play_minimal.png`**: > "A minimalist, line-art UI icon of a play button. The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."
-   **`icon_pause_minimal.png`**: > "A minimalist, line-art UI icon of a pause button. The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."
-   **`icon_profile_minimal.png`**: > "A minimalist, line-art UI icon of a user profile. The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."
-   **`icon_settings_minimal.png`**: > "A minimalist, line-art UI icon of a settings gear. The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."
-   **`icon_search_minimal.png`**: > "A minimalist, line-art UI icon of a magnifying glass for search. The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."
-   **`icon_home_minimal.png`**: > "A minimalist, line-art UI icon of a house for home. The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."
-   **`icon_courses_minimal.png`**: > "A minimalist, line-art UI icon of a book or a stack of books for courses. The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."
-   **`icon_notifications_minimal.png`**: > "A minimalist, line-art UI icon of a bell for notifications. The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."
-   **`icon_logout_minimal.png`**: > "A minimalist, line-art UI icon of a logout symbol (e.g., an arrow leaving a box). The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."
-   **`icon_next_minimal.png`**: > "A minimalist, line-art UI icon of a right-facing arrow for next. The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."
-   **`icon_previous_minimal.png`**: > "A minimalist, line-art UI icon of a left-facing arrow for previous. The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."
-   **`icon_download_minimal.png`**: > "A minimalist, line-art UI icon of a download symbol (e.g., an arrow pointing down into a tray). The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."
-   **`icon_success_minimal.png`**: > "A minimalist, line-art UI icon of a checkmark for success. The style should be clean, modern, and instantly recognizable. Use a single color: #10B981. Consistent stroke width. Transparent background."
-   **`icon_close_minimal.png`**: > "A minimalist, line-art UI icon of an 'X' for close. The style should be clean, modern, and instantly recognizable. Use a single color: #111827. Consistent stroke width. Transparent background."

---

### 3. Hero Images (Style: Professional)

-   **`hero_homepage_professional.png`**:
    -   **Usage Location**: `/live-coding/src/app/page.tsx`
    > "A professional hero image for the homepage of a modern online learning platform. The image should depict a diverse group of engaged learners of various ages and backgrounds collaborating in a bright, modern, and clean environment. The overall mood should be inspiring, professional, and focused. Use a color palette dominated by blues (#2563EB) and neutral grays. The image should have a clear focal point and ample copy space on the right for a headline and call-to-action button. High-resolution, photorealistic."

-   **`hero_instructor_dashboard_professional.png`**:
    -   **Usage Location**: `/live-coding/src/app/(main)/dashboard/page.tsx` (conditionally rendered for instructors)
    > "A hero image for an instructor's dashboard on a learning platform. The image should feature a confident and professional instructor or content creator working on a laptop in a modern office or studio setting. The background should be slightly blurred to focus on the instructor. The image should convey a sense of empowerment and professionalism. Use a calm and professional color palette. High-resolution, photorealistic."

---

### 4. Illustrations (Style: Minimal Professional)

-   **`illustration_empty_state_courses_minimal.png`**:
    -   **Usage Location**: `/live-coding/src/app/(main)/dashboard/page.tsx` (when a student has no enrolled courses)
    > "A minimalist illustration for an 'empty state' on a learning platform, for when a user has not yet enrolled in any courses. The illustration should be clean, simple, and encouraging. It could feature a stylized book, a graduation cap, or a path leading to a distant goal. Use a simple color palette of professional blue (#2563EB) and light gray. The style should be flat, with clean lines and geometric shapes. Transparent background."

-   **`illustration_success_course_completion_minimal.png`**:
    -   **Usage Location**: In a modal or component shown upon course completion, likely triggered from `/live-coding/src/app/(main)/courses/[courseId]/page.tsx`.
    > "A minimalist illustration to celebrate course completion. The illustration should be joyful and rewarding, featuring elements like a stylized certificate, a trophy, or abstract confetti. Use the platform's primary colors, including the success green (#10B981). The style should be clean, modern, and professional. Transparent background."

---

### 5. Course Thumbnails (Style: Minimal)

-   **`course_thumbnail_data_science_minimal.png`**:
    -   **Usage Location**: `/live-coding/src/app/(main)/courses/page.tsx` and `/live-coding/src/app/(main)/dashboard/page.tsx`
    > "A minimalist and abstract course thumbnail for a 'Data Science' course. The design should be clean, geometric, and modern. Use a color palette of blues and grays. It could feature abstract representations of charts, graphs, or nodes. The design should be professional and visually appealing, with space for the course title to be overlaid. 16:9 aspect ratio."

-   **`course_thumbnail_web_development_minimal.png`**:
    -   **Usage Location**: `/live-coding/src/app/(main)/courses/page.tsx` and `/live-coding/src/app/(main)/dashboard/page.tsx`
    > "A minimalist and abstract course thumbnail for a 'Web Development' course. The design should be clean and modern, featuring abstract representations of code brackets (`</>`), browser windows, or CSS layouts. Use a professional color palette. 16:9 aspect ratio."

-   **`course_thumbnail_design_principles_minimal.png`**:
    -   **Usage Location**: `/live-coding/src/app/(main)/courses/page.tsx` and `/live-coding/src/app/(main)/dashboard/page.tsx`
    > "A minimalist and abstract course thumbnail for a 'Design Principles' course. The design should be elegant and clean, featuring geometric shapes, color swatches, or representations of visual hierarchy. Use a balanced and professional color palette. 16:9 aspect ratio."

---

### 6. Avatars (Style: Minimal)

### 6. Avatars (Style: Minimal)
-   **Usage Location**: `/live-coding/src/components/shared/Header.tsx` (in the user profile dropdown) and other user-specific components.
-   **`avatar_default_blue.png`**: > "A simple, abstract, and minimalist default user avatar. The avatar should be a simple geometric pattern contained within a circle. Use a professional and calm color palette, with a primary color of blue (#2563EB). The style should be clean, modern, and gender-neutral."
-   **`avatar_default_green.png`**: > "A simple, abstract, and minimalist default user avatar. The avatar should be a simple geometric pattern contained within a circle. Use a professional and calm color palette, with a primary color of green (#10B981). The style should be clean, modern, and gender-neutral."
-   **`avatar_default_orange.png`**: > "A simple, abstract, and minimalist default user avatar. The avatar should be a simple geometric pattern contained within a circle. Use a professional and calm color palette, with a primary color of orange (#F59E0B). The style should be clean, modern, and gender-neutral."
-   **`avatar_default_purple.png`**: > "A simple, abstract, and minimalist default user avatar. The avatar should be a simple geometric pattern contained within a circle. Use a professional and calm color palette, with a primary color of purple (#8B5CF6). The style should be clean, modern, and gender-neutral."
-   **`avatar_default_gray.png`**: > "A simple, abstract, and minimalist default user avatar. The avatar should be a simple geometric pattern contained within a circle. Use a professional and calm color palette, with a primary color of gray (#6B7280). The style should be clean, modern, and gender-neutral."
