#!/usr/bin/env python3
"""
Script para importar atletas do CSV para o banco de dados
"""

import csv
import mysql.connector
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do banco de dados
DB_CONFIG = {
    'host': os.getenv('DATABASE_HOST', 'localhost'),
    'port': int(os.getenv('DATABASE_PORT', '3306')),
    'user': os.getenv('DATABASE_USER', 'root'),
    'password': os.getenv('DATABASE_PASSWORD', ''),
    'database': os.getenv('DATABASE_NAME', 'atletas_futebol_app'),
}

def parse_date(date_str):
    """Converte data do formato DD/MM/YY para YYYY-MM-DD"""
    if not date_str or date_str.strip() == '':
        return None
    
    try:
        # Formato: DD/MM/YY
        parts = date_str.strip().split('/')
        if len(parts) == 3:
            day, month, year = parts
            # Assumir século 19 se ano > 50, senão século 20
            if len(year) == 2:
                year = f"19{year}" if int(year) > 50 else f"20{year}"
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except Exception as e:
        print(f"Erro ao parsear data '{date_str}': {e}")
    
    return None

def parse_altura(altura_str):
    """Converte altura do formato '1,76' para '176'"""
    if not altura_str or altura_str.strip() == '' or altura_str.strip().upper() == 'ND':
        return None
    
    try:
        # Remove espaços e substitui vírgula por ponto
        altura = altura_str.strip().replace(',', '.')
        # Converte para float e multiplica por 100 para obter centímetros
        altura_cm = int(float(altura) * 100)
        return str(altura_cm)
    except Exception as e:
        print(f"Erro ao parsear altura '{altura_str}': {e}")
    
    return None

def calculate_age(birth_date):
    """Calcula idade a partir da data de nascimento"""
    if not birth_date:
        return None
    
    try:
        birth = datetime.strptime(birth_date, '%Y-%m-%d')
        today = datetime.now()
        age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        return age
    except:
        return None

def normalize_pe(pe_str):
    """Normaliza o campo pé"""
    if not pe_str or pe_str.strip() == '':
        return None
    
    pe = pe_str.strip().upper()
    if pe == 'D':
        return 'direito'
    elif pe == 'E':
        return 'esquerdo'
    elif pe == 'A':
        return 'ambidestro'
    
    return pe_str.strip().lower()

def import_csv(csv_path, user_id):
    """Importa atletas do CSV para o banco de dados"""
    
    print(f"Conectando ao banco de dados...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print(f"Lendo arquivo CSV: {csv_path}")
    
    imported = 0
    errors = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for i, row in enumerate(reader, start=1):
            try:
                # Mapear campos do CSV para o banco
                nome = row.get('ATLETA', '').strip()
                
                if not nome:
                    print(f"Linha {i}: Nome vazio, pulando...")
                    errors += 1
                    continue
                
                posicao = row.get('POSIÇÃO', '').strip() or None
                segunda_posicao = row.get('2ª POSIÇÃO', '').strip() or None
                clube = row.get('CLUBE', '').strip() or None
                data_nascimento = parse_date(row.get('DATA', ''))
                idade_csv = row.get('IDADE', '').strip()
                
                # Calcular idade a partir da data ou usar a do CSV
                if data_nascimento:
                    idade = calculate_age(data_nascimento)
                elif idade_csv and idade_csv.isdigit():
                    idade = int(idade_csv)
                else:
                    idade = None
                
                altura = parse_altura(row.get('ALTURA', ''))
                pe = normalize_pe(row.get('PÉ', ''))
                link = row.get('LINK', '').strip() or None
                escala = row.get('ESCALA', '').strip() or None
                valencia = row.get('VALÊNCIAS', '').strip() or None
                
                # Inserir no banco
                query = """
                    INSERT INTO atletas 
                    (user_id, nome, posicao, segunda_posicao, clube, data_nascimento, 
                     idade, altura, pe, link, escala, valencia, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                """
                
                values = (
                    user_id, nome, posicao, segunda_posicao, clube, data_nascimento,
                    idade, altura, pe, link, escala, valencia
                )
                
                cursor.execute(query, values)
                imported += 1
                
                if imported % 100 == 0:
                    print(f"Importados {imported} atletas...")
                
            except Exception as e:
                print(f"Erro na linha {i} ({nome}): {e}")
                errors += 1
                continue
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"\n{'='*60}")
    print(f"Importação concluída!")
    print(f"Total importado: {imported} atletas")
    print(f"Erros: {errors}")
    print(f"{'='*60}")
    
    return imported, errors

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python import_csv.py <caminho_csv> <user_id>")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    user_id = int(sys.argv[2])
    
    if not os.path.exists(csv_path):
        print(f"Arquivo não encontrado: {csv_path}")
        sys.exit(1)
    
    import_csv(csv_path, user_id)
