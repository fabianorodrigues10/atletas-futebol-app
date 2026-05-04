#!/usr/bin/env python3
"""
Script para substituir campos antigos de scout pelos novos campos de valências
"""

import re

# Mapeamento de campos antigos para novos
REPLACEMENTS = {
    # Campos antigos para novos
    'gols': 'gol',
    'assistencias': 'ass',
    'finalizacoes': 'finC',
    'passes': 'passC',  # Nota: 'passes' pode ser ambíguo, precisa de contexto
    'passesCompletos': 'passC',  # Ajustar conforme necessário
    'cruzamentos': 'cruzC',
    'faltasSofridas': 'faltS',
    'dribles': 'dribC',  # Ajustar conforme necessário
    'desarmes': 'des',
    'interceptacoes': 'inter',
    'duelos': 'duelG',  # Ajustar conforme necessário
    'duelosGanhos': 'duelG',
    'jogosAereos': 'aerG',
    'duelosAereosPerdidos': 'aerP',
    'faltasCometidas': 'falC',
    'bolasRecuperadas': 'recu',
    'cartoesAmarelos': 'removed',  # Remover
    'cartoesVermelhos': 'removed',  # Remover
    'notaAtitudinal': 'removed',  # Remover
    'notaPotencial': 'removed',  # Remover
}

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def replace_field_references(content):
    """Substitui referências aos campos antigos pelos novos"""
    
    # Primeiro, vamos fazer substituições simples
    for old, new in REPLACEMENTS.items():
        if new != 'removed':
            # Substituir em padrões como: scout.gols, scout['gols'], scout.gols =, etc
            content = re.sub(rf'\b{old}\b', new, content)
    
    return content

if __name__ == '__main__':
    # Ler arquivo
    file_path = '/home/ubuntu/atletas_futebol_app/app/(tabs)/marcilio.tsx'
    content = read_file(file_path)
    
    # Fazer substituições
    content = replace_field_references(content)
    
    # Escrever arquivo
    write_file(file_path, content)
    
    print("Substituições concluídas!")
