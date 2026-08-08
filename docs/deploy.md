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

## 1. Instalar GitHub CLI

```powershell
winget install --id GitHub.cli
```

**Cierra y reabre la terminal** para que tome el PATH. Comprueba con `gh --version`
(minúscula en la `n` final: `--versioN` da `unknown flag`).

## 2. Autenticarte

> ⚠️ **Los menús de `gh` se navegan con FLECHAS y Enter, no escribiendo la respuesta.**
> Si tecleas `GitHub.com` y pulsas Enter, ese texto acaba en PowerShell y verás
> `El término 'GitHub.com' no se reconoce...`.
>
> El comando de abajo **evita el problema saltándose todos los menús**.

```powershell
gh auth login --hostname github.com --git-protocol https --web
```

| Flag | Menú que se salta |
|---|---|
| `--hostname github.com` | *What account do you want to log into?* |
| `--git-protocol https` | *What is your preferred protocol for Git operations?* |
| `--web` | *How would you like to authenticate GitHub CLI?* |

Salida esperada:

```
! First copy your one-time code: A1B2-C3D4
Press Enter to open github.com in your browser...
```

Copia el código, pulsa **Enter**, pégalo en el navegador y autoriza. Si aparece algún
`(Y/n)`, responde `Y`.

**Verifica:** `gh auth status` debe decir `Logged in to github.com as <tu-usuario>`.

## 3. 🔒 Blindar tu correo — ANTES del primer push

**Este es el momento.** Git guarda el correo del autor en cada commit y, al hacer público
el repositorio, **queda visible para cualquiera de forma permanente**. Después del push ya
no se puede quitar del historial que otros hayan clonado.

### 3.1 Averigua tu dirección noreply

```powershell
gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"'
```

Devuelve algo como `123456+tuusuario@users.noreply.github.com`. Es una dirección real que
GitHub te da: los correos te llegan, pero no revela la personal.

### 3.2 Configúrala para los commits futuros

```powershell
git config --global user.email "123456+tuusuario@users.noreply.github.com"
```

### 3.3 Corrige los commits que ya existen

Solo si ya hiciste commits con el correo personal **y todavía no has hecho push**:

```powershell
$env:FILTER_BRANCH_SQUELCH_WARNING = 1
git filter-branch -f --env-filter @'
export GIT_AUTHOR_EMAIL="123456+tuusuario@users.noreply.github.com"
export GIT_COMMITTER_EMAIL="123456+tuusuario@users.noreply.github.com"
'@ -- --all
git update-ref -d refs/original/refs/heads/main
```

Preserva mensajes, fechas y contenido; solo cambia el correo. `filter-branch` está deprecado
y avisa mucho, pero viene incluido con Git for Windows y para un puñado de commits es la
herramienta adecuada — `git-filter-repo` exigiría instalar Python.

**Verifica que no quedó rastro:**

```powershell
git log --format='%h %an <%ae> | %cn <%ce>'
```

No debe aparecer tu correo personal en ninguna línea.

### 3.4 El candado del lado de GitHub

Esto es lo que convierte "lo configuré bien" en "es imposible equivocarse".

**github.com → Settings de tu cuenta → Emails:**

- ✅ **Keep my email addresses private**
- ✅ **Block command line pushes that expose my email**

La segunda es la importante: **GitHub rechaza cualquier push que contenga tu correo
personal**, desde el servidor. Aunque cambies de computadora y se te olvide configurar git,
el push falla en vez de filtrar la dirección.

> El **nombre** de autor sí sigue siendo visible. Un nombre de pila no identifica ni permite
> contactar; si prefieres tu usuario de GitHub, cámbialo con
> `git config --global user.name "tuusuario"` antes del paso 3.3.

## 4. Crear el repositorio y subirlo

Desde la carpeta del proyecto:

```powershell
gh repo create fortnite-sprites --public --source=. --push
```

Crea el repo, lo conecta como `origin` y sube `main` de una vez.

> **¿Por qué público?** GitHub Pages en repos privados requiere plan de pago. Y público
> **no** significa que alguien pueda editarlo: solo puede leer el código. Ver
> [seguridad.md](seguridad.md).

## 5. Activar Pages

En `github.com/<tu-usuario>/fortnite-sprites`:

1. **Settings** (arriba a la derecha)
2. **Pages** (menú izquierdo)
3. *Source:* **Deploy from a branch**
4. *Branch:* **`main`**, carpeta **`/ (root)`**
5. **Save**

Tarda **1–2 minutos** la primera vez. La pestaña **Actions** muestra el progreso. Cuando
termine, la URL aparece arriba en la misma página de Settings → Pages.

## 6. Proteger la rama

**Settings** → **Branches** → **Add branch ruleset**:
- *Target:* rama `main`
- Activa **Restrict deletions** y **Block force pushes**

## 7. Activar 2FA

**Settings de tu cuenta** (no del repo) → **Password and authentication** →
**Two-factor authentication**.

Es la medida que más protege el proyecto: el único camino realista para que alguien
modifique tu sitio es robarte la cuenta.

---

## Vía alterna: sin `gh`

Si la autenticación de `gh` se resiste, se puede hacer todo sin él. Git Credential Manager
viene con Git for Windows y abre una ventana del navegador para autenticar.

**Haz igualmente el paso 3** (blindar el correo) antes de esto. Para la dirección noreply,
en vez de `gh api user`, léela en **github.com → Settings → Emails**: aparece justo debajo
de *Keep my email addresses private*.

1. En github.com → **New repository**
   - Nombre: `fortnite-sprites`
   - **Public**
   - **NO** marques *Add a README*, *.gitignore* ni licencia — el repo local ya tiene todo
     y crearlos provocaría un conflicto
2. En la terminal, dentro de la carpeta del proyecto:

```powershell
git remote add origin https://github.com/TU-USUARIO/fortnite-sprites.git
git push -u origin main
```

Se abrirá una ventana del navegador para iniciar sesión. Después, continúa desde el paso 5.

---

## Publicar cambios después

```powershell
git add -A
git commit -m "describe el cambio"
git push
```

Pages se reconstruye solo en ~1 minuto.

## Comprobar que quedó bien

1. Abre un commit en github.com: el autor debe mostrar la dirección **noreply**, no tu Gmail.
2. Abre la URL en el celular.
3. Marca unas variantes y recarga: deben seguir marcadas.
4. **Datos → Copiar link**, ábrelo en una ventana privada y confirma que la comparación
   sale bien.
5. Abre `<tu-url>/test.html`: debe decir **60 pasaron, 0 fallaron**.

## Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| `To get started with GitHub CLI, please run: gh auth login` | No estás autenticado | Paso 2. `gh auth status` lo confirma |
| `El término 'GitHub.com' no se reconoce` | Escribiste la respuesta de un menú de flechas | Usa el comando con flags del paso 2 |
| `unknown flag: --versioN` | `N` mayúscula | `gh --version` |
| `gh: command not found` | PATH sin refrescar | Cierra y reabre la terminal |
| Push rechazado por exponer el correo | **El candado del paso 3.4 funcionando** | Configura la noreply y reescribe los commits |
| `failed to push some refs` / rechazo por historial | Creaste el repo con README desde la web | Borra el repo remoto y créalo vacío, o `git pull --rebase` |
| 404 al abrir la URL | Pages aún construyendo | Espera 2 min y revisa **Actions** |
| Carga sin estilos ni datos | Ruta mal resuelta | Verifica que Pages apunte a `/ (root)`, no a `/docs` |
| Banner rojo de error | JSON del catálogo mal editado | El banner dice el problema exacto; ver [catalogo.md](catalogo.md) |
| Las imágenes no salen | Faltan en `img/sprites/` | Es esperado en 12 entradas; ver [imagenes.md](imagenes.md) |

## Decisiones y por qué

**GitHub Pages sobre Netlify o Vercel.** El repo ya está en Git, no hace falta otra cuenta
ni otro servicio, y sin build step no se aprovecha nada de lo que ofrecen los demás.

**Deploy desde rama en vez de GitHub Actions.** No hay nada que compilar. Un workflow solo
añadiría una pieza más que se puede romper.

**El correo se blinda antes del push, no después.** Es la única ventana en la que se puede
arreglar sin consecuencias: sin remote, reescribir el historial no afecta a nadie.

**Sin dominio propio.** Se puede añadir después con un `CNAME` sin tocar nada del código.

## Evolución

### 2026-08-08 — Sesión 3
- **Reescrito el paso de autenticación.** La versión anterior listaba las respuestas del
  menú (*"→ GitHub.com → HTTPS → Y"*), lo que hizo que se escribieran en la terminal en vez
  de navegarse con flechas. Ahora se usa un solo comando con flags que se salta los menús.
- **Añadida la sección de privacidad del correo** (paso 3), con el candado del lado de
  GitHub. No estaba contemplada y era una fuga real de datos personales.
- Añadida la vía alterna sin `gh`.
- Tabla de problemas comunes ampliada con los errores reales que aparecieron.

### 2026-08-08 — Sesión 2
- Se escribió el procedimiento completo.
- Se añadieron branch protection y 2FA como parte del deploy, no como algo aparte.
- Se añadió la verificación posterior y la tabla de problemas comunes.

### 2026-08-08 — Sesión 1
- Se eligió GitHub Pages y un stack sin build para que publicar fuera solo `git push`.
