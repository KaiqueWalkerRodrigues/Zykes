export const API_BASE = "http://localhost:81";

export const ENDPOINTS = {
  clientes: {
    get: `${API_BASE}/api/gets/get_cliente.php`,
    list: `${API_BASE}/api/gets/get_clientes.php`,
    create: `${API_BASE}/api/creates/create_cliente.php`,
    update: `${API_BASE}/api/updates/update_cliente.php`,
    delete: `${API_BASE}/api/deletes/delete_cliente.php`,
  },
  usuarios: {
    get: `${API_BASE}/api/gets/get_usuario.php`,
    list: `${API_BASE}/api/gets/get_usuarios.php`,
    create: `${API_BASE}/api/creates/create_usuario.php`,
    update: `${API_BASE}/api/updates/update_usuario.php`,
    delete: `${API_BASE}/api/deletes/delete_usuario.php`,
  },
  ordens_servico: {
    list: `${API_BASE}/api/gets/get_ordens_servico.php`,
    create: `${API_BASE}/api/creates/create_ordem_servico.php`,
    update: `${API_BASE}/api/updates/update_ordem_servico.php`,
    delete: `${API_BASE}/api/deletes/delete_ordem_servico.php`,
  },
  caixas: {
    get: `${API_BASE}/api/gets/get_caixa.php`,
    list: `${API_BASE}/api/gets/get_caixas.php`,
    create: `${API_BASE}/api/creates/create_caixa.php`,
    update: `${API_BASE}/api/updates/update_caixa.php`,
    delete: `${API_BASE}/api/deletes/delete_caixa.php`,
  },
  lentes: {
    list: `${API_BASE}/api/gets/get_lentes.php`,
    create: `${API_BASE}/api/creates/create_lentes.php`,
    update: `${API_BASE}/api/updates/update_lentes.php`,
    delete: `${API_BASE}/api/deletes/delete_lentes.php`,
    update_massa: `${API_BASE}/api/updates/update_lentes_massa.php`,
    list_todas: `${API_BASE}/api/gets/get_todas_lentes.php`,
  },
  lente_fornecedores: {
    get: `${API_BASE}/api/gets/get_lente_fornecedor.php`,
    list: `${API_BASE}/api/gets/get_lente_fornecedores.php`,
    create: `${API_BASE}/api/creates/create_lente_fornecedores.php`,
    update: `${API_BASE}/api/updates/update_lente_fornecedores.php`,
    delete: `${API_BASE}/api/deletes/delete_lente_fornecedores.php`,
  },
  lente_familias: {
    get: `${API_BASE}/api/gets/get_lente_familia.php`,
    list: `${API_BASE}/api/gets/get_lente_familias.php`,
    create: `${API_BASE}/api/creates/create_lente_familias.php`,
    update: `${API_BASE}/api/updates/update_lente_familias.php`,
    delete: `${API_BASE}/api/deletes/delete_lente_familias.php`,
  },
  lente_indices: {
    get: `${API_BASE}/api/gets/get_lente_indice.php`,
    list: `${API_BASE}/api/gets/get_lente_indices.php`,
    create: `${API_BASE}/api/creates/create_lente_indices.php`,
    update: `${API_BASE}/api/updates/update_lente_indices.php`,
    delete: `${API_BASE}/api/deletes/delete_lente_indices.php`,
  },
  lente_tratamentos: {
    get: `${API_BASE}/api/gets/get_lente_tratamento.php`,
    list: `${API_BASE}/api/gets/get_lente_tratamentos.php`,
    create: `${API_BASE}/api/creates/create_lente_tratamentos.php`,
    update: `${API_BASE}/api/updates/update_lente_tratamentos.php`,
    delete: `${API_BASE}/api/deletes/delete_lente_tratamentos.php`,
  },
  vendedores: {
    list: `${API_BASE}/api/gets/get_vendedores.php`,
  },
};
