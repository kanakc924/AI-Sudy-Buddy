import { z } from "zod";

export const SummaryOutputSchema = z.object({

  executiveOverview: z
    .string()
    .describe(
      "2-3 sentence high-level summary of the entire topic. Use <mark>term</mark> to highlight the most critical keyword. Never start with filler words."
    ),

  keyConcepts: z
    .array(z.object({
      concept: z.string().describe("Name of the concept"),
      characteristics: z.string().describe("Key properties or how it works — one sentence"),
      useCase: z.string().describe("When or why it is used — one sentence"),
    }))
    .describe("Key concepts as table rows — minimum 3 entries"),

  deepDive: z
    .string()
    .describe(
      `STRICT VERTICAL FORMAT — Every idea MUST be a separate bullet point or numbered item. 
      
      RULES:
      1. Every point MUST start with a dash (-) or a number (1., 2.).
      2. You MUST use a blank line between every single point for vertical breathing room.
      3. Use ### 🔹 for each major sub-heading (minimum 3 headings).
      4. Maximum 3 bullet points per subheading.
      
      EXAMPLE:
      ### 🔹 Heading 1
      - **Point A**: Description
      
      - **Point B**: Description
      
      ### 🔹 Heading 2
      1. **Step 1**: Description
      
      2. **Step 2**: Description`
    ),

  mathematicalFoundations: z
    .array(z.object({
      name: z.string().describe("Name of the formula or theorem (e.g. Softmax Function)"),
      formula: z.string().describe(
        "RAW LaTeX ONLY. Do NOT include dollar signs ($), names, or English 'where' clauses. Example: \\frac{\\exp(u_i)}{\\sum_j \\exp(u_j)}"
      ),
      variables: z.string().describe(
        "Markdown list explaining each variable. Each variable on a new line. Example: - $y_i$ = output probability\n- $u_i$ = raw logit score"
      ),
      intuition: z.string().describe(
        "1-2 sentences explaining what the formula does in plain English. Why is it used? What is the core logic?"
      ),
    }))
    .optional()
    .describe("Include ONLY if the notes contain actual mathematical formulas, scientific notations, or statistical equations"),

  visualProcessFlow: z
    .string()
    .describe(
      `MANDATORY field. Must contain ONLY valid mermaid flowchart TD code. No backticks. No explanatory text. No markdown fences.
      
      CRITICAL: Every node label MUST use double quotes.
      CORRECT: A["Label (with parens)"] --> B["Next Step"]
      WRONG:   A[Label (with parens)] --> B[Next Step]
      
      Minimum 5 nodes. Maximum 10 nodes. Labels maximum 5 words each.
      
      If no process exists in the notes, output this default:
      flowchart TD
          A["Core Concept"] --> B["Key Component 1"]
          A --> C["Key Component 2"]
          B --> D["Application"]
          C --> D`
    ),

  commonPitfalls: z
    .array(z.string())
    .describe(
      "3-5 common mistakes students make. Each item format: MISTAKE: [what they get wrong] → CORRECT: [what is actually true]"
    ),

  definitions: z
    .array(z.object({
      term: z.string().describe("The term in bold"),
      meaning: z.string().describe("One precise sentence definition"),
    }))
    .describe("Glossary table — include every important term from the notes"),

  didYouKnow: z
    .array(z.string())
    .describe("2-4 memorable facts or insights from the notes that aid memory retention"),

  keyTakeaways: z
    .array(z.string())
    .describe(
      "3-5 exam-ready statements. Each must be a complete, testable fact. Format: [Bold concept name]: one sentence of what to know"
    ),

});

export type SummaryOutput = z.infer<typeof SummaryOutputSchema>;
