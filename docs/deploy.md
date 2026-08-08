# Deploy en GitHub Pages

## Qué hace

Publica el sitio gratis en `https://<tu-usuario>.github.io/fortnite-sprites/`, accesible
desde cualquier dispositivo. Como no hay build step, publicar es literalmente hacer `git push`.

## Antes de empezar

Abre [`index.html`](../index.html) con **Live Server** y revísalo. Es más fácil arreglar
cosas antes de publicar. (No lo abras con doble clic: el navegador bloquea `fetch()` sobre
`file://` y el catálogo no cargará.)

Si quieres verlo con datos en vez de vacío, abre primero [`test-seed.html`](../test-seed.html):
siembra una colección de ejemplo. Para dejarlo limpio después, ve a **Datos → Borrar todo**.

---

## Paso a paso

### 1. Instalar GitHub CLI

Evita pelear con tokens de acceso.

```powershell
winget install --id GitHub.cli
```

**Cierra y reabre la terminal** para que tome el PATH. Comprueba con `gh --version`.

### 2. Autenticarte

```powershell
gh auth login
```

Responde:
- *What account do you want to log into?* → **GitHub.com**
- *What is your preferred protocol?* → **HTTPS**
- *Authenticate Git with your GitHub credentials?* → **Y**
- *How would you like to authenticate?* → **Login with a web browser**

Copia el código de 8 caracteres que aparece, pulsa Enter, pégalo en el navegador y autoriza.

### 3. Crear el repositorio y subirlo

Desde la carpeta del proyecto:

```powershell
gh repo create fortnite-sprites --public --source=. --push
```

Crea el repo, lo conecta como `origin` y sube `main` de una vez.

> **¿Por qué público?** GitHub Pages en repos privados requiere plan de pago. Y público
> **no** significa que alguien pueda editarlo: solo puede leer el código. Ver
> [seguridad.md](seguridad.md).

### 4. Activar Pages

En `github.com/<tu-usuario>/fortnite-sprites`:

1. **Settings** (arriba a la derecha)
2. **Pages** (menú izquierdo)
3. *Source:* **Deploy from a branch**
4. *Branch:* **`main`**, carpeta **`/ (root)`**
5. **Save**

### 5. Esperar

Tarda **1–2 minutos** la primera vez. La pestaña **Actions** muestra el progreso. Cuando
termine, la URL aparece arriba en la misma página de Settings → Pages.

### 6. Proteger la rama

**Settings** → **Branches** → **Add branch ruleset**:
- *Target:* rama `main`
- Activa **Restrict deletions** y **Block force pushes**

### 7. Activar 2FA

**Settings de tu cuenta** (no del repo) → **Password and authentication** →
**Two-factor authentication**.

Es la medida que más protege el proyecto: el único camino realista para que alguien
modifique tu sitio es robarte la cuenta.

---

## Publicar cambios después

```powershell
git add -A
git commit -m "describe el cambio"
git push
```

Pages se reconstruye solo en ~1 minuto.

## Comprobar que quedó bien

1. Abre la URL en el celular.
2. Marca unas variantes y recarga: deben seguir marcadas.
3. **Datos → Copiar link**, ábrelo en una ventana privada y confirma que la comparación
   sale bien.
4. Abre `<tu-url>/test.html`: debe decir **60 pasaron, 0 fallaron**.

## Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| 404 al abrir la URL | Pages aún construyendo | Espera 2 min y revisa **Actions** |
| Carga sin estilos ni datos | Ruta mal resuelta | Verifica que Pages apunte a `/ (root)`, no a `/docs` |
| Banner rojo de error | JSON del catálogo mal editado | El banner dice el problema exacto; ver [catalogo.md](catalogo.md) |
| Las imágenes no salen | Faltan en `img/sprites/` | Es esperado en 12 entradas; ver [imagenes.md](imagenes.md) |
| `gh: command not found` | PATH sin refrescar | Cierra y reabre la terminal |

## Decisiones y por qué

**GitHub Pages sobre Netlify o Vercel.** El repo ya está en Git, no hace falta otra cuenta
ni otro servicio, y sin build step no se aprovecha nada de lo que ofrecen los demás.

**Deploy desde rama en vez de GitHub Actions.** No hay nada que compilar. Un workflow solo
añadiría una pieza más que se puede romper.

**Sin dominio propio.** Se puede añadir después con un `CNAME` sin tocar nada del código.

## Evolución

### 2026-08-08 — Sesión 2
- Se escribió el procedimiento completo.
- Se añadieron los pasos de branch protection y 2FA como parte del deploy, no como algo
  aparte: publicar y proteger van juntos.
- Se añadió la verificación posterior y la tabla de problemas comunes.

### 2026-08-08 — Sesión 1
- Se eligió GitHub Pages y un stack sin build para que publicar fuera solo `git push`.
