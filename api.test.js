const request = require('supertest');
const express = require('express');

// Mock - arquivo principal
const app = express();
app.use(express.json());

// Mock da autenticação
const API_KEY = '17e393bbdd78b1cb14d30c0a6cf3669b18b5cb385eafe0d170157d41253718ba';
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API Key necessária',
            message: 'Forneça uma API Key válida no header x-api-key ou authorization'
        });
    }
    
    if (apiKey !== API_KEY) {
        return res.status(403).json({
            success: false,
            error: 'API Key inválida',
            message: 'API Key fornecida não é válida'
        });
    }
    
    next();
};

// Mock - endpoints para teste
app.get('/', (req, res) => {
    res.json({ 
        message: 'API de Pesquisas e Cadastro de Clientes funcionando!',
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
            testApi: 'GET /api/v1/test (requer API Key)',
            pesquisas: 'GET /api/v1/pesquisas (requer API Key)',
            consultar: 'GET /api/v1/clientes/:cpf (requer API Key)',
            cadastrar: 'POST /api/v1/clientes (requer API Key)',
            atualizar: 'PUT /api/v1/clientes/:cpf (requer API Key)',
            deletar: 'DELETE /api/v1/clientes/:cpf (requer API Key)'
        },
        links: {
            self: 'http://localhost:3000/',
            docs: 'http://localhost:3000/api/v1/docs'
        }
    });
});

app.get('/api/v1/test', authenticateApiKey, (req, res) => {
    res.json({
        success: true,
        message: 'API Test endpoint funcionando!',
        data: {
            status: 'success',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        },
        links: {
            self: 'http://localhost:3000/api/v1/test',
            api_root: 'http://localhost:3000/'
        }
    });
});

// Mock - endpoint de pesquisas (sem banco para teste)
app.get('/api/v1/pesquisas', authenticateApiKey, (req, res) => {
    const mockData = [
        {
            id: 1,
            pergunta: "O que é uma API REST?",
            resposta: "Uma API REST é uma interface baseada no estilo arquitetural REST",
            fonte: "Artigo teste"
        }
    ];
    
    res.json({
        success: true,
        message: 'Pesquisas encontradas',
        data: mockData,
        meta: {
            total: 1,
            limit: 50,
            offset: 0,
            sort: 'id',
            order: 'ASC'
        },
        links: {
            self: 'http://localhost:3000/api/v1/pesquisas'
        }
    });
});

// Mock - endpoint de clientes
app.post('/api/v1/clientes', authenticateApiKey, (req, res) => {
    const { nome, cpf, telefone, estado } = req.body;
    
    if (!nome || !cpf) {
        return res.status(400).json({
            success: false,
            error: 'Dados obrigatórios',
            message: 'Nome e CPF são obrigatórios'
        });
    }
    
    const mockCliente = { nome, cpf, telefone, estado };
    
    res.status(201).json({
        success: true,
        message: 'Cliente cadastrado com sucesso',
        data: mockCliente,
        links: {
            self: `http://localhost:3000/api/v1/clientes/${cpf}`,
            collection: 'http://localhost:3000/api/v1/clientes'
        }
    });
});

describe('API REST - Testes Unitários', () => {
    
    describe('GET /', () => {
        test('Deve retornar informações da API', async () => {
            const response = await request(app).get('/');
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('API de Pesquisas e Cadastro de Clientes funcionando!');
            expect(response.body.status).toBe('online');
            expect(response.body.version).toBe('1.0.0');
            expect(response.body.endpoints).toBeDefined();
            expect(response.body.links).toBeDefined();
        });
    });

    describe('GET /api/v1/test', () => {
        test('Deve retornar erro 401 sem API Key', async () => {
            const response = await request(app).get('/api/v1/test');
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('API Key necessária');
        });

        test('Deve retornar erro 403 com API Key inválida', async () => {
            const response = await request(app)
                .get('/api/v1/test')
                .set('x-api-key', 'api-key-invalida');
            
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('API Key inválida');
        });

        test('Deve retornar sucesso com API Key válida', async () => {
            const response = await request(app)
                .get('/api/v1/test')
                .set('x-api-key', API_KEY);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('API Test endpoint funcionando!');
            expect(response.body.data).toBeDefined();
            expect(response.body.links).toBeDefined();
        });
    });

    describe('GET /api/v1/pesquisas', () => {
        test('Deve retornar erro 401 sem API Key', async () => {
            const response = await request(app).get('/api/v1/pesquisas');
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test('Deve retornar pesquisas com API Key válida', async () => {
            const response = await request(app)
                .get('/api/v1/pesquisas')
                .set('x-api-key', API_KEY);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Pesquisas encontradas');
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.meta).toBeDefined();
            expect(response.body.links).toBeDefined();
        });
    });

    describe('POST /api/v1/clientes', () => {
        test('Deve retornar erro 401 sem API Key', async () => {
            const response = await request(app)
                .post('/api/v1/clientes')
                .send({ nome: 'Teste', cpf: '12345678901' });
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test('Deve retornar erro 400 sem dados obrigatórios', async () => {
            const response = await request(app)
                .post('/api/v1/clientes')
                .set('x-api-key', API_KEY)
                .send({ telefone: '11999999999' });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Dados obrigatórios');
        });

        test('Deve cadastrar cliente com sucesso', async () => {
            const clienteData = {
                nome: 'João Silva',
                cpf: '12345678901',
                telefone: '11999999999',
                estado: 'SP'
            };

            const response = await request(app)
                .post('/api/v1/clientes')
                .set('x-api-key', API_KEY)
                .send(clienteData);
            
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Cliente cadastrado com sucesso');
            expect(response.body.data.nome).toBe(clienteData.nome);
            expect(response.body.data.cpf).toBe(clienteData.cpf);
            expect(response.body.links).toBeDefined();
        });
    });

    describe('Estrutura de Response', () => {
        test('Responses de sucesso devem ter estrutura padronizada', async () => {
            const response = await request(app)
                .get('/api/v1/test')
                .set('x-api-key', API_KEY);
            
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('links');
            expect(response.body.success).toBe(true);
        });

        test('Responses de erro devem ter estrutura padronizada', async () => {
            const response = await request(app).get('/api/v1/test');
            
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('message');
            expect(response.body.success).toBe(false);
        });
    });

    describe('Headers HTTP', () => {
        test('Deve aceitar API Key no header x-api-key', async () => {
            const response = await request(app)
                .get('/api/v1/test')
                .set('x-api-key', API_KEY);
            
            expect(response.status).toBe(200);
        });

        test('Deve aceitar API Key no header authorization', async () => {
            const response = await request(app)
                .get('/api/v1/test')
                .set('authorization', API_KEY);
            
            expect(response.status).toBe(200);
        });
    });
});
