# Trainer Workout Reactions

This document describes the workout reaction system that allows trainers to react to client workouts with emojis.

## Overview

The workout reaction system allows trainers to react to client workouts with emojis, providing quick feedback and encouragement. This feature works across both the web trainer dashboard and mobile client app.

## Features

- **Quick Emoji Reactions**: Trainers can react with emojis (🔥, 💪, 👏, ❤️, 😮, 😂)
- **Real-time Updates**: Reactions appear instantly in both web and mobile apps
- **Multiple Reactions**: Trainers can add multiple different emoji reactions to the same workout
- **Persistent Storage**: Reactions are stored in Firestore and persist across sessions
- **Cross-platform**: Works on trainer web dashboard and client mobile app

## User Flow

### Trainer Side (Web Dashboard)
1. Trainer views client workout in the workout detail page
2. Trainer clicks on emoji buttons below each exercise set
3. Reaction is saved to Firestore and appears immediately
4. Trainer can add multiple different reactions to the same workout

### Client Side (Mobile App)
1. Client views their completed workout in the mobile app
2. Client sees trainer reactions displayed below exercises
3. Reactions show with timestamp indicating when trainer reacted
4. Client receives positive reinforcement and feedback

## Database Structure

Reactions are stored in the `reactions` array field of a workout document:

\`\`\`javascript
// users/{userId}/workouts/{workoutId}
{
  name: "Upper Body Workout",
  exercises: [...],
  // Only exists if there are reactions
  reactions: [
    {
      emoji: "💪",
      trainerId: "trainer123",
      timestamp: Firestore.Timestamp
    },
    {
      emoji: "🔥", 
      trainerId: "trainer456",
      timestamp: Firestore.Timestamp
    }
  ]
}
\`\`\`

## API Routes

The following API route handles workout reactions:

#### `POST /api/workouts/[workoutId]/reactions`

Saves a trainer reaction to a specific workout.

**Request Body:**
\`\`\`typescript
{
  emoji: string,
  trainerId: string,
  userId: string // The client's user ID
}
\`\`\`

**Response:**
\`\`\`typescript
{
  success: boolean,
  message: string
}
\`\`\`

### Service Functions

The following service functions are available in `lib/firebase/workout-reactions-service.ts`:

#### `saveWorkoutReaction`

Saves a reaction to a workout.

\`\`\`typescript
saveWorkoutReaction(
  userId: string,
  workoutId: string,
  emoji: string,
  trainerId: string
): Promise<void>
\`\`\`

#### `getWorkoutReactions`

Gets all reactions for a workout.

\`\`\`typescript
getWorkoutReactions(
  userId: string,
  workoutId: string
): Promise<WorkoutReaction[]>
\`\`\`

#### `hasTrainerReacted`

Checks if a trainer has already reacted to a workout.

\`\`\`typescript
hasTrainerReacted(
  userId: string,
  workoutId: string,
  trainerId: string
): Promise<boolean>
\`\`\`

#### `getTrainerReactions`

Gets reactions from a specific trainer.

\`\`\`typescript
getTrainerReactions(
  userId: string,
  workoutId: string,
  trainerId: string
): Promise<WorkoutReaction[]>
\`\`\`

## Components

### `EmojiPicker`
Located at `components/workout/emoji-picker.tsx`
- Renders clickable emoji buttons
- Handles emoji selection and reaction saving
- Shows loading states during API calls

### `ClientWorkoutView`
Located at `components/client-workout-view.tsx`
- Main component for viewing client workouts
- Integrates emoji picker for trainer reactions
- Displays existing reactions

## Usage

### Adding Reactions (Trainer Web App)

In the `ClientWorkoutView` component, trainers can click on emoji buttons to react to workouts:

\`\`\`typescript
// Handle emoji click
const handleSetEmojiClick = (emoji: string) => {
  // Save the reaction to Firebase
  saveReaction(emoji)
}
\`\`\`

### Displaying Reactions (Client Mobile App)

The client mobile app can display reactions by reading the `reactions` array from the workout document:

\`\`\`typescript
// Display reactions
{workout.reactions && workout.reactions.length > 0 && (
  <div className="reactions-container">
    {workout.reactions.map((reaction, index) => (
      <div key={index} className="reaction">
        <span className="emoji">{reaction.emoji}</span>
        <span className="timestamp">
          {new Date(reaction.timestamp?.seconds * 1000).toLocaleDateString()}
        </span>
      </div>
    ))}
  </div>
)}
\`\`\`

## Future Enhancements

Potential future enhancements to the reaction system:

1. **Reaction Removal**: Allow trainers to remove their reactions by clicking again
2. **Reaction Limits**: Option to limit to one reaction per trainer per workout/exercise
3. **Push Notifications**: Notify clients immediately when trainers react to workouts
4. **Reaction Analytics**: Dashboard showing most used emojis and reaction patterns
5. **Custom Emojis**: Allow trainers to upload custom reaction emojis
6. **Reaction Comments**: Add optional text comments with emoji reactions
7. **Reaction Leaderboards**: Show which clients receive the most reactions
8. **Reaction Insights**: Analytics on client motivation based on reaction frequency
