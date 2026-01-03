export interface ScenarioConfig {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    toughTongueId: string;
    customEmbedUrl: string;
    requiredAttempts: number;
    order: number; // For sequential flow
}

export const SCENARIO_CONFIG: ScenarioConfig[] = [
    {
        id: "1",
        title: "PTM Assessment: Handling Parent Concerns",
        description: "Navigate a challenging Parent-Teacher Meeting where a parent is concerned about their child's progress. Practice active listening and evidence-based feedback.",
        difficulty: "Intermediate",
        toughTongueId: "693877e7b8892d3f7b91eb31",
        customEmbedUrl: "https://bambinos.app.toughtongueai.com/embed/693877e7b8892d3f7b91eb31?skipPrecheck=true",
        requiredAttempts: 1,
        order: 1 // First attempt
    },
    {
        id: "4",
        title: "Coach: The Perfect Renewal Call",
        description: "Learn the best practices for a renewal call. Focus on value proposition, celebrating student wins, and closing the renewal effectively.",
        difficulty: "Intermediate",
        toughTongueId: "6942c17a25f8fcc9bc250d03",
        customEmbedUrl: "https://bambinos.app.toughtongueai.com/embed/6942c17a25f8fcc9bc250d03?skipPrecheck=true",
        requiredAttempts: 2,
        order: 2
    },
    {
        id: "2",
        title: "PTM Coach: Framework Mastery",
        description: "Master the structural framework for conducting effective PTMs. Focus on the \"Sandwich Method\" of feedback and setting actionable goals.",
        difficulty: "Advanced",
        toughTongueId: "6939d23e07d90d92fea80199",
        customEmbedUrl: "https://bambinos.app.toughtongueai.com/embed/6939d23e07d90d92fea80199?skipPrecheck=true",
        requiredAttempts: 2,
        order: 3
    },
    {
        id: "3",
        title: "Renewal Roleplay: Hesitant Parent (English Communication)",
        description: "Roleplay a renewal conversation with a parent hesitant due to perceived lack of improvement in English communication skills. Address objections convincingly.",
        difficulty: "Advanced",
        toughTongueId: "693a7c1507d90d92fea80744",
        customEmbedUrl: "https://bambinos.app.toughtongueai.com/embed/693a7c1507d90d92fea80744?skipPrecheck=true",
        requiredAttempts: 2,
        order: 4
    }
];

// Final assessment (same as first, but different order)
export const FINAL_ASSESSMENT_CONFIG: ScenarioConfig = {
    id: "1",
    title: "PTM Assessment: Handling Parent Concerns",
    description: "Navigate a challenging Parent-Teacher Meeting where a parent is concerned about their child's progress. Practice active listening and evidence-based feedback.",
    difficulty: "Intermediate",
    toughTongueId: "693877e7b8892d3f7b91eb31",
    customEmbedUrl: "https://bambinos.app.toughtongueai.com/embed/693877e7b8892d3f7b91eb31?skipPrecheck=true",
    requiredAttempts: 1,
    order: 5 // Final attempt
};

export function getAllScenariosInOrder(): ScenarioConfig[] {
    const scenarios: ScenarioConfig[] = [];
    
    // Add initial assessment
    scenarios.push(SCENARIO_CONFIG[0]);
    
    // Add renewal call (2 attempts)
    for (let i = 0; i < SCENARIO_CONFIG[1].requiredAttempts; i++) {
        scenarios.push({ ...SCENARIO_CONFIG[1], order: 2 + i });
    }
    
    // Add framework (2 attempts)
    for (let i = 0; i < SCENARIO_CONFIG[2].requiredAttempts; i++) {
        scenarios.push({ ...SCENARIO_CONFIG[2], order: 4 + i });
    }
    
    // Add roleplay (2 attempts)
    for (let i = 0; i < SCENARIO_CONFIG[3].requiredAttempts; i++) {
        scenarios.push({ ...SCENARIO_CONFIG[3], order: 6 + i });
    }
    
    // Add final assessment
    scenarios.push({ ...FINAL_ASSESSMENT_CONFIG, order: 8 });
    
    return scenarios;
}

export function getScenarioConfigById(id: string): ScenarioConfig | undefined {
    return SCENARIO_CONFIG.find(s => s.id === id) || (id === "1" ? FINAL_ASSESSMENT_CONFIG : undefined);
}

export function getRequiredAttempts(scenarioId: string): number {
    const config = getScenarioConfigById(scenarioId);
    if (!config) return 1;
    
    // Special handling: Assessment (id: "1") needs 2 total attempts (1 at start, 1 at end)
    if (scenarioId === "1") {
        return 2; // Total of 2 attempts needed
    }
    
    return config.requiredAttempts;
}

