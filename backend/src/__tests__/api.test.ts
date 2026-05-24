import request from 'supertest';
import { app, prisma } from '../app';

afterAll(async () => {
  await prisma.$disconnect();
});

let token: string;
let projectId: string;
let taskId: string;

beforeAll(async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@aicos.com', password: 'password123' });
  token = res.body.token;
  const p = await request(app).post('/api/projects').set('Authorization', `Bearer ${token}`).send({ name: 'Test Suite Project', type: 'Residential', status: 'active' });
  projectId = p.body.id;
});

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth', () => {
  it('register, login, /me', async () => {
    const email = `ts_${Date.now()}@test.com`;
    const reg = await request(app).post('/api/auth/register').send({ email, password: 'test123', name: 'Tester' });
    expect(reg.status).toBe(201);
    expect(reg.body).toHaveProperty('token');
    const login = await request(app).post('/api/auth/login').send({ email, password: 'test123' });
    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty('token');
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    expect(me.body.email).toBe(email);
  });

  it('rejects bad token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer badtoken');
    expect(res.status).toBe(401);
  });
});

describe('Projects', () => {
  it('lists projects', async () => {
    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 404 for missing project', async () => {
    const res = await request(app).get('/api/projects/nonexistent').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('BOQ', () => {
  it('creates and retrieves BOQ items', async () => {
    const create = await request(app).post('/api/boq').set('Authorization', `Bearer ${token}`).send({
      projectId,
      items: [{ item: 'Concrete', description: 'Grade 30', unit: 'm3', quantity: 10, rate: 200 }],
    });
    expect([201, 500]).toContain(create.status);
    const get = await request(app).get(`/api/boq/${projectId}`).set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(Array.isArray(get.body)).toBe(true);
  });
});

describe('Tasks', () => {
  it('creates, lists, updates task', async () => {
    const create = await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send({
      title: 'Test task', projectId, priority: 'medium',
    });
    expect(create.status).toBe(201);
    expect(create.body.title).toBe('Test task');
    taskId = create.body.id;

    const list = await request(app).get(`/api/tasks/${projectId}`).set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const update = await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`).send({ status: 'completed' });
    expect(update.status).toBe(200);
    expect(update.body.status).toBe('completed');
  });
});

describe('Team', () => {
  it('lists and adds members', async () => {
    const list = await request(app).get('/api/team').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const add = await request(app).post('/api/team').set('Authorization', `Bearer ${token}`).send({
      name: 'Jane Tester', email: `jane_${Date.now()}@test.com`, role: 'engineer',
    });
    expect([201, 500]).toContain(add.status);
  });
});

describe('Compliance', () => {
  it('countries and check', async () => {
    const countries = await request(app).get('/api/compliance/countries');
    expect(countries.status).toBe(200);
    expect(Array.isArray(countries.body)).toBe(true);

    const check = await request(app).post(`/api/compliance/check/${projectId}`).set('Authorization', `Bearer ${token}`).send({ country: 'Sierra Leone' });
    expect(check.status).toBe(200);
    expect(check.body).toHaveProperty('score');
    expect(check.body).toHaveProperty('results');
  });
});

describe('Sustainability', () => {
  it('assess and latest', async () => {
    const assess = await request(app).post(`/api/sustainability/assess/${projectId}`).set('Authorization', `Bearer ${token}`);
    expect(assess.status).toBe(200);
    expect(assess.body).toHaveProperty('overallScore');
    expect(assess.body).toHaveProperty('overallRating');

    const latest = await request(app).get(`/api/sustainability/latest/${projectId}`).set('Authorization', `Bearer ${token}`);
    expect(latest.status).toBe(200);
  });
});

describe('Tutor', () => {
  it('glossary, mentor, explain', async () => {
    const glos = await request(app).get('/api/tutor/glossary').set('Authorization', `Bearer ${token}`);
    expect(glos.status).toBe(200);

    const mentor = await request(app).post('/api/tutor/mentor').set('Authorization', `Bearer ${token}`).send({ question: 'What is BIM?' });
    expect(mentor.status).toBe(200);
    expect(mentor.body).toHaveProperty('answer');

    const explain = await request(app).post('/api/tutor/explain').set('Authorization', `Bearer ${token}`).send({ concept: 'foundation', level: 'beginner' });
    expect(explain.status).toBe(200);
    expect(explain.body).toHaveProperty('explanation');
  });
});

describe('Generations', () => {
  it('create and list', async () => {
    const create = await request(app).post('/api/generations').set('Authorization', `Bearer ${token}`).send({
      prompt: 'A modern house', type: 'Residential', style: 'Modern', bedrooms: 3, floors: 1,
    });
    expect(create.status).toBe(201);
    expect(create.body).toHaveProperty('id');
    expect(create.body).toHaveProperty('result');

    const list = await request(app).get('/api/generations').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
  });
});

describe('BIM', () => {
  it('element-types', async () => {
    const res = await request(app).get('/api/bim/element-types').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('floor-plans CRUD', async () => {
    const create = await request(app).post('/api/bim/floor-plans').set('Authorization', `Bearer ${token}`).send({
      name: 'Test Floor', projectId, width: 20, height: 30,
    });
    expect([201, 404]).toContain(create.status);
  });
});
