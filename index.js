
require('dotenv').config();
const express = require('express');
const { Client } = require('pg');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';


const getBaseUrl = () => {
    if (process.env.BASE_URL) {
        return process.env.BASE_URL;
    }
    
    
    if (NODE_ENV === 'production' || process.env.RENDER) {
        return 'https://projetotccapi.onrender.com';
    }
    
    return `http://localhost:${PORT}`;
};

const BASE_URL = getBaseUrl();


app.use(express.json());


const CORS_ORIGINS = process.env.CORS_ORIGINS || '*';
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', CORS_ORIGINS);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});


const rateLimit = require('express-rate-limit');

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100;
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15;

const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW * 60 * 1000,
    max: RATE_LIMIT_MAX,
    message: {
        error: 'Muitas requisições',
        message: `Limite de ${RATE_LIMIT_MAX} requisições excedido. Tente novamente em ${RATE_LIMIT_WINDOW} minutos.`,
        retryAfter: `${RATE_LIMIT_WINDOW} minutes`
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);


const SWAGGER_TITLE = process.env.SWAGGER_TITLE || 'API de Pesquisas e Cadastro de Clientes';
const API_VERSION = process.env.API_VERSION || '1.0.0';
const SWAGGER_DESCRIPTION = process.env.SWAGGER_DESCRIPTION || 'API REST para gerenciamento de pesquisas acadêmicas e cadastro de clientes';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: SWAGGER_TITLE,
            version: API_VERSION,
            description: SWAGGER_DESCRIPTION,
            contact: {
                name: 'Marcela - Projeto TCC',
                email: 'marcela@exemplo.com'
            }
        },
        servers: [
            {
                url: BASE_URL,
                description: NODE_ENV === 'production' ? 'Servidor de produção (Render)' : 'Servidor de desenvolvimento'
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
    apis: ['./index.js'] 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);


app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'API Documentation - TCC Marcela',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
        persistAuthorization: true
    }
}));


const API_KEY = process.env.API_KEY;


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


const clientPesquisas = new Client({
    connectionString: process.env.DB_PESQUISAS_URL || 'postgresql://bd_projeto_tcc_user:00a99UTdlLeMcvlBmSEzQwuaCEfN2L7j@dpg-d2946opr0fns73f1mlo0-a.oregon-postgres.render.com/bd_projeto_tcc',
    ssl: { rejectUnauthorized: false }
});

const clientClientes = new Client({
    connectionString: process.env.DB_CLIENTES_URL || 'postgresql://cadastro_clientes_wa08_user:vAAUcxoxpqP0Esoor3yE5IhKFx1omNhK@dpg-d2o7tsv5r7bs738ik2cg-a.oregon-postgres.render.com/cadastro_clientes_wa08',
    ssl: { rejectUnauthorized: false }
});


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

// ===== FUNÇÕES UTILITÁRIAS =====

/**
 * Converte textos com \n ou \\n literais em quebras de linha reais
 * @param {string} text - Texto a ser processado
 * @returns {string} - Texto com quebras de linha reais
 */
const processTextLineBreaks = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Primeiro converte \\n (barra dupla + n) em quebra de linha real
    // Depois converte \n (barra simples + n) em quebra de linha real
    return text
        .replace(/\\\\n/g, '\n')  // \\n -> quebra de linha real
        .replace(/\\n/g, '\n');   // \n -> quebra de linha real
};

/**
 * Processa todos os campos de texto de um objeto, convertendo quebras de linha
 * @param {Object} obj - Objeto a ser processado
 * @returns {Object} - Objeto com textos processados
 */
const processObjectLineBreaks = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const processed = { ...obj };
    
    // Processa cada propriedade do objeto
    for (const key in processed) {
        if (typeof processed[key] === 'string') {
            processed[key] = processTextLineBreaks(processed[key]);
        }
    }
    
    return processed;
};

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
// Retorna informações gerais sobre a API
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
            self: `${BASE_URL}/`,
            docs: `${BASE_URL}/api/v1/docs`
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
// Teste da API
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
            self: `${BASE_URL}/api/v1/test`,
            api_root: `${BASE_URL}/`
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
// PESQUISAS
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
        
        // Processa os textos para converter quebras de linha literais em reais
        // e adiciona campo 'fonte' combinando artigo, autor e link para compatibilidade
        const processedData = result.rows.map(row => {
            const processedRow = processObjectLineBreaks(row);
            
            // Adiciona campo 'fonte' combinando os campos separados
            if (processedRow.artigo || processedRow.autor || processedRow.link) {
                const fonteParts = [];
                if (processedRow.artigo) fonteParts.push(processedRow.artigo);
                if (processedRow.autor) fonteParts.push(processedRow.autor);
                if (processedRow.link) fonteParts.push(processedRow.link);
                processedRow.fonte = fonteParts.join('\n');
            }
            
            return processedRow;
        });
        
        res.json({
            success: true,
            message: 'Pesquisas encontradas',
            data: processedData,
            meta: {
                total: total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                sort: sortField,
                order: sortOrder
            },
            links: {
                self: `${BASE_URL}/api/v1/pesquisas?sort=${sortField}&order=${order}&limit=${limit}&offset=${offset}`,
                first: `${BASE_URL}/api/v1/pesquisas?sort=${sortField}&order=${order}&limit=${limit}&offset=0`,
                next: offset + parseInt(limit) < total ? `${BASE_URL}/api/v1/pesquisas?sort=${sortField}&order=${order}&limit=${limit}&offset=${offset + parseInt(limit)}` : null
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
// CONSULTAR CLIENTE
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
        
        // Processa os textos para converter quebras de linha literais em reais
        const processedClient = processObjectLineBreaks(result.rows[0]);
        
        res.json({
            success: true,
            message: 'Cliente encontrado',
            data: processedClient,
            links: {
                self: `${BASE_URL}/api/v1/clientes/${cpf}`,
                update: `${BASE_URL}/api/v1/clientes/${cpf}`,
                delete: `${BASE_URL}/api/v1/clientes/${cpf}`,
                collection: `${BASE_URL}/api/v1/clientes`
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
//CADASTRAR CLIENTE
app.post('/api/v1/clientes', authenticateApiKey, async (req, res) => {
    try {
        const { nome, cpf, telefone, estado } = req.body;
        
        
        if (!nome || !cpf) {
            return res.status(400).json({
                success: false,
                error: 'Dados obrigatórios',
                message: 'Nome e CPF são obrigatórios'
            });
        }
        
        
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
        
        
        const result = await clientClientes.query(
            'INSERT INTO cadastro_clientes (nome, cpf, telefone, estado) VALUES ($1, $2, $3, $4) RETURNING nome, cpf, telefone, estado',
            [nome, cpf, telefone, estado]
        );
        
        // Processa os textos para converter quebras de linha literais em reais
        const processedNewClient = processObjectLineBreaks(result.rows[0]);
        
        res.status(201).json({
            success: true,
            message: 'Cliente cadastrado com sucesso',
            data: processedNewClient,
            links: {
                self: `${BASE_URL}/api/v1/clientes/${result.rows[0].cpf}`,
                collection: `${BASE_URL}/api/v1/clientes`
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
// ATUALIZAR CLIENTE
app.put('/api/v1/clientes/:cpf', authenticateApiKey, async (req, res) => {
    try {
        const { cpf } = req.params;
        const { nome, telefone, estado } = req.body;
        
        
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
        
        values.push(cpf); 
        
        const result = await clientClientes.query(
            `UPDATE cadastro_clientes SET ${updates.join(', ')} WHERE cpf = $${paramIndex} RETURNING nome, cpf, telefone, estado`,
            values
        );
        
        // Processa os textos para converter quebras de linha literais em reais
        const processedUpdatedClient = processObjectLineBreaks(result.rows[0]);
        
        res.json({
            success: true,
            message: 'Cliente atualizado com sucesso',
            data: processedUpdatedClient,
            links: {
                self: `${BASE_URL}/api/v1/clientes/${cpf}`,
                collection: `${BASE_URL}/api/v1/clientes`
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
// DELETAR CLIENTE
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
        
        // Processa os textos para converter quebras de linha literais em reais
        const processedDeletedClient = processObjectLineBreaks(existingClient.rows[0]);
        
        res.json({
            success: true,
            message: 'Cliente deletado com sucesso',
            data: processedDeletedClient,
            links: {
                collection: `${BASE_URL}/api/v1/clientes`,
                create: `${BASE_URL}/api/v1/clientes`
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

// 8. Inicia o servidor
app.listen(PORT, () => {
    console.log(`🚀 API rodando em ${BASE_URL}`);
    console.log(`📝 Versão: ${API_VERSION} - Ambiente: ${NODE_ENV}`);
    console.log(`📚 Documentação: ${BASE_URL}/api/v1/docs`);
    console.log(`🔒 Rate Limit: ${RATE_LIMIT_MAX} requests/${RATE_LIMIT_WINDOW} min`);
});