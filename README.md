# Propuesta de valor · Empresas SURA

Aplicación web guiada, basada en la metodología *Propuesta de valor y Modelo de negocio* (Mercado – Empresas SURA) y en el lienzo de propuesta de valor de Alex Osterwalder.

## Pasos

0. **Inicio**: nombre, correo, empresa y NIT (valida el dígito de verificación).
1. **Segmentos**: hasta 5 segmentos de clientes.
2. **Análisis del cliente** (por segmento): motivadores/necesidades, hábitos de compra, comportamiento digital, costumbres/estilo de vida, inhibidores y sociodemográfico.
3. **Motivadores**: se separan del análisis y se priorizan (arrastrar o flechas).
4. **Competencia**: hasta 4 competidores por segmento; calificación de 1 a 5 de los motivadores priorizados frente a la empresa (tabla tipo diapositiva 12), con promedio y brecha.
5. **Perfil del cliente**: extracción automática de trabajos, frustraciones y beneficios a partir de los pasos 1–4 (editable).
6. **Propuesta de valor**: productos y servicios, aliviadores de frustraciones y creadores de alegrías, conectados al perfil, con vista de encaje.
7. **Resumen**: imprimible / PDF, respaldo JSON descargable y cargable.

Los datos se guardan solo en el navegador (`localStorage`).

## Desarrollo y despliegue

Sitio estático sin dependencias ni compilación.

```bash
python3 -m http.server 8000   # http://localhost:8000
```

En Vercel: importar el repositorio con el preset **Other**, sin comando de build y con el directorio raíz como salida.
