#!/usr/bin/env node
// Script para subir ZIP + docs a Supabase Storage
// Requiere: SUPABASE_URL, SUPABASE_ANON_KEY (o SERVICE_ROLE_KEY solo si tú lo gestionas)
// Bucket privado recomendado: project-backups

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const bucket = process.env.BUCKET_NAME || 'project-backups'

if (!url || !key) {
  console.error('Falta SUPABASE_URL y SUPABASE_ANON_KEY (o SERVICE_ROLE_KEY)')
  process.exit(1)
}

const supabase = createClient(url, key)
const files = [
  'casa-abierta-cuba.zip',
  'ARQUITECTURA.md',
  'CAMBIOS.md',
  'FASE1_AUDITORIA.md',
  'INSTALACION.md',
  'PENDIENTES.md',
]

async function upload() {
  for (const f of files) {
    const p = path.join(process.cwd(), f)
    if (!fs.existsSync(p)) {
      console.log('⚠️  No existe:', p)
      continue
    }
    const buf = fs.readFileSync(p)
    const { error } = await supabase.storage.from(bucket).upload(`casa-abierta-cuba/${f}`, buf, { upsert: true, contentType: 'application/octet-stream' })
    if (error) console.error('ERROR', f, error.message)
    else console.log('OK', f, buf.length, 'bytes')
  }
}
upload()
