import { MuscleGroup } from '@/components/programs/muscle-group-selector';
import OpenAI from 'openai';

const openai = new OpenAI();

const systemPrompt = `You are a clasifier, your goal is to get an exercise name and try to select what is the right muscle group for it,
only pick one single value, the primary muscle group for the given exercise.
the possible muscle groups are:
${Object.values(MuscleGroup).join(', ')}
if the exercise name is not clear, just return the empty string. do not give any additional information. response using the following json format:
[{
    "exerciseName": "Lat Pulldown",
    "muscleGroup": "Back"
},
{
    "exerciseName": "Bench Press",
    "muscleGroup": "Chest"
},
{
    "exerciseName": "Squats",
    "muscleGroup": "Quads"
}
]
`;
const aiErrorMessage = 'I\'m sorry, I couldn\'t find the information you were looking for. Please try again.';

export const enum ModelResponseFormat {
    TEXT = 'text',
    JSON = 'json_object'
}

export async function getModelResponse(
    exerciseNames: string[],
    responseFormat: ModelResponseFormat,
): Promise<string> {
    console.log("getting model response for", systemPrompt)
    const completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: exerciseNames.join('\n')
            }
        ],
        response_format: { type: responseFormat }
    });
    return completion.choices[0].message.content ?? aiErrorMessage;
}
