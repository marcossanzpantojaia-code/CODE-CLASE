# Mi equipo de fútbol 7 - versión 3 (interfaz gráfica con tkinter)
import tkinter as tk

# Constantes
PRECIO_CANTERANO = 10
PRECIO_GALACTICO = 25
TAMANO_PLANTILLA = 10
PRESUPUESTO_INICIAL = 150

# Variables del mercado
presupuesto = PRESUPUESTO_INICIAL
gastado = 0
canteranos = 0
galacticos = 0


def calcular_rango():
    if canteranos >= 5 and galacticos >= 2:
        return "🏆 Rango: Candidato al título"
    elif canteranos >= 5:
        return "🌱 Rango: Equipo de cantera"
    elif canteranos + galacticos == 0:
        return "🪑 Rango: Sin plantilla"
    else:
        return "⚽ Rango: Equipo en construcción"


def actualizar_etiquetas():
    # Presupuesto y plantilla, y jugadores de cada tipo
    etiqueta_estado.config(text=f"Presupuesto: {presupuesto} M€ · Plantilla: {canteranos + galacticos}/{TAMANO_PLANTILLA}")
    etiqueta_jugadores.config(text=f"🌱 Canteranos: {canteranos}    ⭐ Galácticos: {galacticos}")


def fichar():
    global presupuesto, gastado, canteranos, galacticos
    tipo = tipo_jugador.get()
    texto = entrada_cantidad.get().strip()

    # Si no es un número se trata como cantidad no válida (la ventana no se cierra)
    if texto.lstrip("-").isdigit():
        cantidad = int(texto)
    else:
        cantidad = 0

    if tipo == "canterano":
        coste = cantidad * PRECIO_CANTERANO
    elif tipo == "galactico":
        coste = cantidad * PRECIO_GALACTICO
    else:
        coste = 0

    fichas_libres = TAMANO_PLANTILLA - (canteranos + galacticos)

    # Mismas comprobaciones y en el mismo orden que la versión de consola
    if tipo != "canterano" and tipo != "galactico":
        mensaje = "✘ Ese jugador no está en el mercado"
    elif cantidad <= 0:
        mensaje = "✘ La cantidad debe ser mayor que 0"
    elif coste > presupuesto:
        mensaje = f"✘ No tienes presupuesto suficiente: cuesta {coste} M€ y tienes {presupuesto} M€"
    elif cantidad > fichas_libres:
        mensaje = f"✘ No caben en la plantilla: quedan {fichas_libres} fichas libres"
    else:
        presupuesto -= coste
        gastado += coste
        if tipo == "canterano":
            canteranos += cantidad
        else:
            galacticos += cantidad
        mensaje = f"✔ Has fichado {cantidad} x {tipo} por {coste} M€"

    etiqueta_mensaje.config(text=mensaje)
    actualizar_etiquetas()


def cerrar_mercado():
    # Muestra lo gastado y el rango, y bloquea el botón Fichar
    etiqueta_mensaje.config(text=f"Gastado en fichajes: {gastado} M€\n{calcular_rango()}")
    boton_fichar.config(state="disabled")
    boton_cerrar.config(state="disabled")


# Ventana
ventana = tk.Tk()
ventana.title("Mercado de fichajes")

tk.Label(ventana, text="⚽  BIENVENIDO AL MERCADO DE FICHAJES  ⚽").pack(pady=5)

etiqueta_estado = tk.Label(ventana)
etiqueta_estado.pack()

tipo_jugador = tk.StringVar(value="canterano")
tk.Radiobutton(ventana, text="🌱 Canterano (10 M€)", variable=tipo_jugador, value="canterano").pack()
tk.Radiobutton(ventana, text="⭐ Galáctico (25 M€)", variable=tipo_jugador, value="galactico").pack()

tk.Label(ventana, text="Cantidad:").pack()
entrada_cantidad = tk.Entry(ventana)
entrada_cantidad.pack()

boton_fichar = tk.Button(ventana, text="Fichar", command=fichar)
boton_fichar.pack(pady=5)

etiqueta_mensaje = tk.Label(ventana, text="")
etiqueta_mensaje.pack()

etiqueta_jugadores = tk.Label(ventana)
etiqueta_jugadores.pack()

boton_cerrar = tk.Button(ventana, text="Cerrar el mercado", command=cerrar_mercado)
boton_cerrar.pack(pady=5)

actualizar_etiquetas()
ventana.mainloop()
