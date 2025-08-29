//Importa os módulos
require('dotenv').config();
const express = require('express');
const { Client } = require('pg');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


const app = express();
const port = process.env.PORT || 3000;

//Middleware para JSON e CORS
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

//Rate Limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela de tempo
    message: {
        error: 'Muitas requisições',
        message: 'Limite de requisições excedido. Tente novamente em 15 minutos.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

//Configuração - Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Pesquisas e Cadastro de Clientes',
            version: '1.0.0',
            description: 'API REST para gerenciamento de pesquisas acadêmicas e cadastro de clientes',
            contact: {
                name: 'Marcela - Projeto TCC',
                email: 'marcela@exemplo.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de desenvolvimento'
            }
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-api-key',
                    description: 'API Key necessária para autenticação'
                }
            },
            schemas: {
                Cliente: {
                    type: 'object',
                    required: ['nome', 'cpf'],
                    properties: {
                        nome: {
                            type: 'string',
                            description: 'Nome completo do cliente'
                        },
                        cpf: {
                            type: 'string',
                            description: 'CPF do cliente'
                        },
                        telefone: {
                            type: 'string',
                            description: 'Telefone do cliente'
                        },
                        estado: {
                            type: 'string',
                            description: 'Estado onde o cliente reside'
                        }
                    }
                },
                Pesquisa: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID único da pesquisa'
                        },
                        pergunta: {
                            type: 'string',
                            description: 'Pergunta da pesquisa'
                        },
                        resposta: {
                            type: 'string',
                            description: 'Resposta da pesquisa'
                        },
                        fonte: {
                            type: 'string',
                            description: 'Fonte da informação'
                        }
                    }
                },
                StandardResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Indica se a operação foi bem-sucedida'
                        },
                        message: {
                            type: 'string',
                            description: 'Mensagem descritiva da operação'
                        },
                        data: {
                            type: 'object',
                            description: 'Dados retornados pela operação'
                        },
                        links: {
                            type: 'object',
                            description: 'Links HATEOAS relacionados'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            description: 'Tipo do erro'
                        },
                        message: {
                            type: 'string',
                            description: 'Mensagem detalhada do erro'
                        }
                    }
                }
            }
        },
        security: [
            {
                ApiKeyAuth: []
            }
        ]
    },
    apis: ['./index.js'] // Arquivo - Comentários da Documentação
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rota para servir a documentação Swagger
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'API Documentation - TCC Marcela',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
        persistAuthorization: true
    }
}));

//API Key para autenticação
const API_KEY = process.env.API_KEY || '17e393bbdd78b1cb14d30c0a6cf3669b18b5cb385eafe0d170157d41253718ba';

//Middleware de autenticação
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    
    if (!apiKey) {
        return res.status(401).json({
            error: 'API Key necessária',
            message: 'Forneça uma API Key válida no header x-api-key ou authorization'
        });
    }
    
    if (apiKey !== API_KEY) {
        return res.status(403).json({
            error: 'API Key inválida',
            message: 'API Key fornecida não é válida'
        });
    }
    
    next();
};

//Configuração do banco de dados
const clientPesquisas = new Client({
    connectionString: process.env.DB_PESQUISAS_URL || 'postgresql://bd_projeto_tcc_user:00a99UTdlLeMcvlBmSEzQwuaCEfN2L7j@dpg-d2946opr0fns73f1mlo0-a.oregon-postgres.render.com/bd_projeto_tcc',
    ssl: { rejectUnauthorized: false }
});

const clientClientes = new Client({
    connectionString: process.env.DB_CLIENTES_URL || 'postgresql://cadastro_clientes_wa08_user:vAAUcxoxpqP0Esoor3yE5IhKFx1omNhK@dpg-d2o7tsv5r7bs738ik2cg-a.oregon-postgres.render.com/cadastro_clientes_wa08',
    ssl: { rejectUnauthorized: false }
});

// 7. Conecta aos bancos de dados
Promise.all([
    clientPesquisas.connect(),
    clientClientes.connect()
])
.then(() => {
    console.log('✅ Conexões com os bancos de dados estabelecidas!');
})
.catch(err => {
    console.error('❌ Erro ao conectar aos bancos:', err);
});

// ===== ENDPOINTS DA API =====

/**
 * @swagger
 * /:
 *   get:
 *     summary: Informações da API
 *     description: Retorna informações gerais sobre a API e seus endpoints disponíveis
 *     tags: [Sistema]
 *     security: []
 *     responses:
 *       200:
 *         description: Informações da API retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "API de Pesquisas e Cadastro de Clientes funcionando!"
 *                 status:
 *                   type: string
 *                   example: "online"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                 links:
 *                   type: object
 */
// 1 - Teste da API
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

/**
 * @swagger
 * /api/v1/test:
 *   get:
 *     summary: Endpoint de teste
 *     description: Endpoint para testar se a API está funcionando corretamente
 *     tags: [Sistema]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Teste realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *       401:
 *         description: API Key não fornecida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: API Key inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 2 - Teste da API - GET /api/v1/test (PROTEGIDO)
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

/**
 * @swagger
 * /api/v1/pesquisas:
 *   get:
 *     summary: Listar pesquisas
 *     description: Retorna lista de pesquisas com suporte a filtering, sorting e paginação
 *     tags: [Pesquisas]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [id, titulo, data_criacao]
 *           default: id
 *         description: Campo para ordenação
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Direção da ordenação
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Número máximo de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Número de resultados para pular
 *     responses:
 *       200:
 *         description: Pesquisas encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Pesquisas encontradas"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pesquisa'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     sort:
 *                       type: string
 *                     order:
 *                       type: string
 *                 links:
 *                   type: object
 *       401:
 *         description: API Key não fornecida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 3 - PESQUISAS - GET /api/v1/pesquisas (PROTEGIDO)
app.get('/api/v1/pesquisas', authenticateApiKey, async (req, res) => {
    try {
        // Filtering e Sorting
        const { sort = 'id', order = 'asc', limit = 50, offset = 0 } = req.query;
        const validSortFields = ['id', 'titulo', 'data_criacao'];
        const sortField = validSortFields.includes(sort) ? sort : 'id';
        const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        
        const result = await clientPesquisas.query(
            `SELECT * FROM bd_pesquisa ORDER BY ${sortField} ${sortOrder} LIMIT $1 OFFSET $2`,
            [parseInt(limit), parseInt(offset)]
        );
        
        const countResult = await clientPesquisas.query('SELECT COUNT(*) FROM bd_pesquisa');
        const total = parseInt(countResult.rows[0].count);
        
        res.json({
            success: true,
            message: 'Pesquisas encontradas',
            data: result.rows,
            meta: {
                total: total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                sort: sortField,
                order: sortOrder
            },
            links: {
                self: `http://localhost:3000/api/v1/pesquisas?sort=${sortField}&order=${order}&limit=${limit}&offset=${offset}`,
                first: `http://localhost:3000/api/v1/pesquisas?sort=${sortField}&order=${order}&limit=${limit}&offset=0`,
                next: offset + parseInt(limit) < total ? `http://localhost:3000/api/v1/pesquisas?sort=${sortField}&order=${order}&limit=${limit}&offset=${offset + parseInt(limit)}` : null
            }
        });
    } catch (err) {
        console.error('Erro ao buscar pesquisas:', err);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor',
            message: 'Não foi possível buscar as pesquisas'
        });
    }
});

/**
 * @swagger
 * /api/v1/clientes/{cpf}:
 *   get:
 *     summary: Consultar cliente por CPF
 *     description: Retorna informações de um cliente específico pelo CPF
 *     tags: [Clientes]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do cliente
 *         example: "12345678901"
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cliente encontrado"
 *                 data:
 *                   $ref: '#/components/schemas/Cliente'
 *                 links:
 *                   type: object
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: API Key não fornecida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 4 - CONSULTAR CLIENTE - GET /api/v1/clientes/:cpf (PROTEGIDO)
app.get('/api/v1/clientes/:cpf', authenticateApiKey, async (req, res) => {
    try {
        const { cpf } = req.params;
        
        const result = await clientClientes.query(
            'SELECT nome, cpf, telefone, estado FROM cadastro_clientes WHERE cpf = $1',
            [cpf]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Cliente não encontrado',
                error: 'Não existe cadastro para este CPF'
            });
        }
        
        res.json({
            success: true,
            message: 'Cliente encontrado',
            data: result.rows[0],
            links: {
                self: `http://localhost:3000/api/v1/clientes/${cpf}`,
                update: `http://localhost:3000/api/v1/clientes/${cpf}`,
                delete: `http://localhost:3000/api/v1/clientes/${cpf}`,
                collection: 'http://localhost:3000/api/v1/clientes'
            }
        });
        
    } catch (err) {
        console.error('Erro ao consultar cadastro:', err);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor',
            message: 'Não foi possível consultar o cadastro'
        });
    }
});

/**
 * @swagger
 * /api/v1/clientes:
 *   post:
 *     summary: Cadastrar novo cliente
 *     description: Cria um novo cliente no sistema
 *     tags: [Clientes]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *           example:
 *             nome: "João Silva"
 *             cpf: "12345678901"
 *             telefone: "11999999999"
 *             estado: "SP"
 *     responses:
 *       201:
 *         description: Cliente cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cliente cadastrado com sucesso"
 *                 data:
 *                   $ref: '#/components/schemas/Cliente'
 *                 links:
 *                   type: object
 *       400:
 *         description: Dados obrigatórios não fornecidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: CPF já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: API Key não fornecida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 5 - CADASTRAR CLIENTE - POST /api/v1/clientes (PROTEGIDO)
app.post('/api/v1/clientes', authenticateApiKey, async (req, res) => {
    try {
        const { nome, cpf, telefone, estado } = req.body;
        
        // Validação básica
        if (!nome || !cpf) {
            return res.status(400).json({
                success: false,
                error: 'Dados obrigatórios',
                message: 'Nome e CPF são obrigatórios'
            });
        }
        
        // Verifica se o CPF já existe
        const existingClient = await clientClientes.query(
            'SELECT cpf FROM cadastro_clientes WHERE cpf = $1',
            [cpf]
        );
        
        if (existingClient.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'CPF já cadastrado',
                message: 'Já existe um cadastro com este CPF'
            });
        }
        
        // Insere o novo cliente
        const result = await clientClientes.query(
            'INSERT INTO cadastro_clientes (nome, cpf, telefone, estado) VALUES ($1, $2, $3, $4) RETURNING nome, cpf, telefone, estado',
            [nome, cpf, telefone, estado]
        );
        
        res.status(201).json({
            success: true,
            message: 'Cliente cadastrado com sucesso',
            data: result.rows[0],
            links: {
                self: `http://localhost:3000/api/v1/clientes/${result.rows[0].cpf}`,
                collection: 'http://localhost:3000/api/v1/clientes'
            }
        });
        
    } catch (err) {
        console.error('Erro ao cadastrar cliente:', err);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: 'Não foi possível cadastrar o cliente'
        });
    }
});

/**
 * @swagger
 * /api/v1/clientes/{cpf}:
 *   put:
 *     summary: Atualizar cliente
 *     description: Atualiza informações de um cliente existente
 *     tags: [Clientes]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do cliente a ser atualizado
 *         example: "12345678901"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do cliente
 *               telefone:
 *                 type: string
 *                 description: Telefone do cliente
 *               estado:
 *                 type: string
 *                 description: Estado onde o cliente reside
 *           example:
 *             nome: "João Silva Santos"
 *             telefone: "11888888888"
 *             estado: "RJ"
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *       400:
 *         description: Nenhum campo fornecido para atualização
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: API Key não fornecida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 6 - ATUALIZAR CLIENTE - PUT /api/v1/clientes/:cpf (PROTEGIDO)
app.put('/api/v1/clientes/:cpf', authenticateApiKey, async (req, res) => {
    try {
        const { cpf } = req.params;
        const { nome, telefone, estado } = req.body;
        
        // Verifica se o cliente existe
        const existingClient = await clientClientes.query(
            'SELECT cpf FROM cadastro_clientes WHERE cpf = $1',
            [cpf]
        );
        
        if (existingClient.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cliente não encontrado',
                message: 'Não existe um cadastro com este CPF'
            });
        }
        
        // Monta a query de atualização dinamicamente
        const updates = [];
        const values = [];
        let paramIndex = 1;
        
        if (nome) {
            updates.push(`nome = $${paramIndex}`);
            values.push(nome);
            paramIndex++;
        }
        if (telefone) {
            updates.push(`telefone = $${paramIndex}`);
            values.push(telefone);
            paramIndex++;
        }
        if (estado) {
            updates.push(`estado = $${paramIndex}`);
            values.push(estado);
            paramIndex++;
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum campo para atualizar',
                message: 'Forneça pelo menos um campo para atualizar (nome, telefone, estado)'
            });
        }
        
        values.push(cpf); // CPF vai por último para o WHERE
        
        const result = await clientClientes.query(
            `UPDATE cadastro_clientes SET ${updates.join(', ')} WHERE cpf = $${paramIndex} RETURNING nome, cpf, telefone, estado`,
            values
        );
        
        res.json({
            success: true,
            message: 'Cliente atualizado com sucesso',
            data: result.rows[0],
            links: {
                self: `http://localhost:3000/api/v1/clientes/${cpf}`,
                collection: 'http://localhost:3000/api/v1/clientes'
            }
        });
        
    } catch (err) {
        console.error('Erro ao atualizar cliente:', err);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: 'Não foi possível atualizar o cliente'
        });
    }
});

/**
 * @swagger
 * /api/v1/clientes/{cpf}:
 *   delete:
 *     summary: Deletar cliente
 *     description: Remove um cliente do sistema
 *     tags: [Clientes]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do cliente a ser deletado
 *         example: "12345678901"
 *     responses:
 *       200:
 *         description: Cliente deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cliente deletado com sucesso"
 *                 data:
 *                   $ref: '#/components/schemas/Cliente'
 *                 links:
 *                   type: object
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: API Key não fornecida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 7 - DELETAR CLIENTE - DELETE /api/v1/clientes/:cpf (PROTEGIDO)
app.delete('/api/v1/clientes/:cpf', authenticateApiKey, async (req, res) => {
    try {
        const { cpf } = req.params;
        
        // Verifica se o cliente existe antes de deletar
        const existingClient = await clientClientes.query(
            'SELECT nome, cpf FROM cadastro_clientes WHERE cpf = $1',
            [cpf]
        );
        
        if (existingClient.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cliente não encontrado',
                message: 'Não existe um cadastro com este CPF'
            });
        }
        
        // Deleta o cliente
        await clientClientes.query(
            'DELETE FROM cadastro_clientes WHERE cpf = $1',
            [cpf]
        );
        
        res.json({
            success: true,
            message: 'Cliente deletado com sucesso',
            data: existingClient.rows[0],
            links: {
                collection: 'http://localhost:3000/api/v1/clientes',
                create: 'http://localhost:3000/api/v1/clientes'
            }
        });
        
    } catch (err) {
        console.error('Erro ao deletar cliente:', err);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: 'Não foi possível deletar o cliente'
        });
    }
});

// 8 - Inicia o servidor
app.listen(port, () => {
    console.log(`🚀 API rodando em http://localhost:${port}`);
    console.log(`📝 Versão: 1.0.0 - Simplificada`);
});