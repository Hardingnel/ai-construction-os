import { Router, Response } from 'express';
import { prisma, db } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  explainConcept,
  searchGlossary,
  glossarySeed,
  mentorChat,
  getSessionHistory,
  getSessionMessages,
  getContextualHelp,
} from '../services/tutorService';

const router = Router();

router.post('/explain', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { concept, level } = req.body;
    if (!concept) return res.status(400).json({ message: 'Concept is required' });
    const result = await explainConcept({ concept, level: level || 'beginner' });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/glossary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { query, category, difficulty } = req.query as any;
    const result = await searchGlossary(query, category, difficulty);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/glossary/seed', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await glossarySeed();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/mentor', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { question, sessionId, context } = req.body;
    if (!question) return res.status(400).json({ message: 'Question is required' });
    const result = await mentorChat({ question, sessionId, userId: req.userId!, context });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/sessions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await getSessionHistory(req.userId!);
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/sessions/:sessionId/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const messages = await getSessionMessages(req.params.sessionId);
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/context-help', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = (req.query.page as string) || 'dashboard';
    const help = await getContextualHelp(page);
    res.json(help);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as tutorRouter };
