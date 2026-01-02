import axios from 'axios';

export interface ToughTongueSessionResponse {
    id: string;
    status: 'pending' | 'active' | 'processing' | 'completed' | 'failed';
    evaluation_results?: Record<string, any>;
    transcript_content?: string;
    duration?: number;
    completed_at?: string;
    created_at?: string;
    [key: string]: any;
}

export class ToughTongueService {
    private readonly apiKey: string;
    private readonly orgId: string;
    private readonly baseURL = 'https://api.toughtongueai.com/api/public';

    constructor() {
        this.apiKey = process.env.TOUGH_TONGUE_API_KEY || '';
        this.orgId = process.env.TOUGH_TONGUE_ORG_ID || '691d87662da66ac3081ba73d';
        if (!this.apiKey) {
            console.warn('⚠️  Tough Tongue API key not configured');
        }
    }

    /**
     * Get standard headers for Tough Tongue API requests
     * Matches Ai-Hiring implementation
     */
    private getHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Bambinos-Teacher-Backend/1.0',
            'Authorization': `Bearer ${this.apiKey}`,
            'X-TT-ORG': this.orgId
        };
    }

    /**
     * Get session details from Tough Tongue API
     */
    async getSessionDetails(sessionId: string): Promise<ToughTongueSessionResponse> {
        if (!this.apiKey) {
            throw new Error('Tough Tongue API key not configured');
        }

        try {
            const url = `${this.baseURL}/sessions/${sessionId}`;
            console.log(`🔍 ToughTongueService: Fetching session: ${url}`);

            const response = await axios.get<ToughTongueSessionResponse>(url, {
                timeout: 45000, // Match Ai-Hiring timeout
                headers: this.getHeaders()
            });

            return response.data;
        } catch (error: any) {
            console.error('❌ ToughTongueService: Error fetching session:', error.message);
            
            if (error.response?.status === 404) {
                throw new Error('Session not found in Tough Tongue');
            }
            if (error.response?.status === 401) {
                throw new Error('Invalid Tough Tongue API credentials');
            }
            throw new Error(`Failed to fetch session: ${error.message}`);
        }
    }

    /**
     * Trigger analysis for a session
     * Based on: POST /api/public/sessions/analyze
     */
    async triggerAnalysis(sessionId: string): Promise<void> {
        if (!this.apiKey) {
            throw new Error('Tough Tongue API key not configured');
        }

        try {
            const url = `${this.baseURL}/sessions/analyze`;
            console.log(`🔄 ToughTongueService: Triggering analysis for session: ${sessionId}`);

            await axios.post(url, {
                session_id: sessionId
            }, {
                timeout: 45000, // Match Ai-Hiring timeout
                headers: this.getHeaders()
            });

            console.log(`✅ ToughTongueService: Analysis triggered successfully`);
        } catch (error: any) {
            console.error('❌ ToughTongueService: Error triggering analysis:', error.message);
            throw new Error(`Failed to trigger analysis: ${error.message}`);
        }
    }

    /**
     * Poll until evaluation results are ready
     * After onSubmit, we need to wait for evaluation_results to be available
     * Following Ai-Hiring pattern: poll for up to 7.5 minutes (30 attempts × 15s)
     */
    async pollUntilEvaluationReady(sessionId: string): Promise<ToughTongueSessionResponse> {
        const maxAttempts = 15; // 7.5 minutes total
        const intervalMs = 30000; // 30 seconds between attempts
        let attempts = 0;
        let analysisTriggered = false;

        console.log(`🔄 ToughTongueService: Starting polling for evaluation results (max ${maxAttempts} attempts)`);

        while (attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`🔍 Attempt ${attempts}/${maxAttempts}: Checking session ${sessionId}`);

                const results = await this.getSessionDetails(sessionId);

                // Check if we have meaningful evaluation results
                const hasEvaluationResults = results.evaluation_results && 
                    Object.keys(results.evaluation_results).length > 0 &&
                    (results.evaluation_results.overall_score || 
                     results.evaluation_results.final_score ||
                     results.evaluation_results.detailed_feedback);

                if (hasEvaluationResults) {
                    // Results are ready!
                    console.log(`✅ ToughTongueService: Evaluation results ready on attempt ${attempts}`);
                    return results;
                }

                // If session is completed/active but no evaluation results, trigger analysis
                const shouldTriggerAnalysis = (results.status === 'completed' || results.status === 'active') 
                    && !analysisTriggered 
                    && !hasEvaluationResults;

                if (shouldTriggerAnalysis) {
                    console.log(`🔄 ToughTongueService: Status '${results.status}' but no evaluation. Triggering analysis...`);
                    try {
                        await this.triggerAnalysis(sessionId);
                        analysisTriggered = true;
                    } catch (error) {
                        console.warn('⚠️  Failed to trigger analysis, continuing to poll...');
                    }
                }

                // Log current status
                console.log(`⏳ Status: ${results.status}, Has evaluation: ${hasEvaluationResults}, Waiting ${intervalMs}ms...`);

                // Wait before next attempt
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, intervalMs));
                }

            } catch (error: any) {
                console.error(`❌ Attempt ${attempts} failed:`, error);
                
                // If session is not found (404), stop polling immediately
                if (error.message?.includes('Session not found') || 
                    error.message?.includes('404') ||
                    error.response?.status === 404) {
                    console.warn(`⚠️  Session ${sessionId} not found in Tough Tongue. Stopping polling.`);
                    break; // Exit the loop immediately
                }
                
                // For other errors, continue polling
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, intervalMs));
                }
            }
        }

        // After max attempts, get final status
        console.log(`⏰ ToughTongueService: Max attempts reached, getting final status...`);
        const finalResults = await this.getSessionDetails(sessionId);
        
        // Check one more time if evaluation is ready
        const hasEvaluationResults = finalResults.evaluation_results && 
            Object.keys(finalResults.evaluation_results).length > 0 &&
            (finalResults.evaluation_results.overall_score || 
             finalResults.evaluation_results.final_score ||
             finalResults.evaluation_results.detailed_feedback);

        if (hasEvaluationResults) {
            console.log(`✅ ToughTongueService: Evaluation results ready after timeout`);
            return finalResults;
        }

        // If still no evaluation, return what we have (might have transcript)
        console.warn(`⚠️  ToughTongueService: No evaluation results after ${maxAttempts} attempts, returning available data`);
        return finalResults;
    }

    /**
     * Parse Tough Tongue response to extract evaluation data
     */
    parseEvaluationData(sessionData: ToughTongueSessionResponse): {
        score: number | null;
        evaluation: Record<string, any>;
    } {
        const evaluation = sessionData.evaluation_results || {};
        const transcript = sessionData.transcript_content || '';
        const duration = sessionData.duration || 0;

        // Extract score with fallbacks
        let score: number | null = null;
        
        // Try final_score first
        if (evaluation.final_score !== null && evaluation.final_score !== undefined) {
            if (typeof evaluation.final_score === 'number') {
                score = evaluation.final_score; // This correctly handles 0
            } else {
                // Parse string to number, handling 0 correctly
                const parsed = parseFloat(String(evaluation.final_score));
                score = isNaN(parsed) ? null : parsed;
            }
        } 
        // Fallback to overall_score
        else if (evaluation.overall_score !== null && evaluation.overall_score !== undefined) {
            if (typeof evaluation.overall_score === 'number') {
                score = evaluation.overall_score; // This correctly handles 0
            } else if (typeof evaluation.overall_score === 'string') {
                // Try to extract from various string formats:
                // "Final Score: 0.0/10" or "0.0/10" or "85%" or just "85"
                let match = evaluation.overall_score.match(/Final Score:\s*(\d+(?:\.\d+)?)/i);
                if (!match) {
                    match = evaluation.overall_score.match(/(\d+(?:\.\d+)?)\s*\/\s*10/i);
                }
                if (!match) {
                    match = evaluation.overall_score.match(/(\d+(?:\.\d+)?)\s*%/i);
                }
                if (!match) {
                    match = evaluation.overall_score.match(/(\d+(?:\.\d+)?)/);
                }
                
                if (match) {
                    const parsed = parseFloat(match[1]);
                    score = isNaN(parsed) ? null : parsed;
                }
            }
        }

        // Build evaluation object (excluding transcript and quiz_results)
        // Remove transcript and quiz_results from evaluation data
        const { transcript: _, transcript_content: __, quiz_results: ___, ...evaluationWithoutTranscript } = evaluation;
        
        const fullEvaluation: Record<string, any> = {
            ...evaluationWithoutTranscript,
            duration: duration,
            completed_at: sessionData.completed_at,
            created_at: sessionData.created_at,
            status: sessionData.status
        };

        return {
            score: score,
            evaluation: fullEvaluation
        };
    }
}


