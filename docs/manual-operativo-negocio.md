# SIMI - Manual operativo para negocios

Guia practica para que un negocio gastronomico use SIMI en el dia a dia.

Este documento esta pensado para administradores, encargados de caja, cocina, atencion y delivery.

## 1. Objetivo del sistema

SIMI ayuda al negocio a operar mejor con una carta digital, pedidos ordenados, reservas, pagos, cocina y delivery desde un solo panel.

El objetivo no es reemplazar al equipo, sino reducir desorden:

- menos pedidos incompletos por WhatsApp
- menos cartas desactualizadas
- menos confusiones en cocina
- mejor control de pagos
- mejor experiencia para el comensal

## 2. Roles principales

### Superadministrador SIMI

Es quien administra todos los negocios dentro del sistema.

Puede:

- crear negocios
- editar datos principales
- activar modulos
- revisar solicitudes de demo
- dar acceso a usuarios

### Administrador del negocio

Es el dueno o encargado principal del restaurante.

Puede:

- editar la carta
- crear productos
- gestionar pedidos
- validar pagos
- revisar reservas
- configurar delivery
- actualizar horarios y datos del negocio

### Cocina

Es el usuario o equipo que prepara los pedidos.

Debe enfocarse en:

- ver pedidos confirmados
- marcar pedidos en preparacion
- marcar pedidos listos

### Repartidor

En el MVP se gestiona desde el modulo Delivery.

Debe enfocarse en:

- recibir pedido asignado
- marcar salida a ruta
- confirmar entrega

## 3. Alta inicial de un negocio

Este paso lo realiza el superadministrador o el equipo SIMI.

1. Entrar al panel de administracion.
2. Ir a `Negocios`.
3. Seleccionar `Nuevo cliente`.
4. Completar datos principales:
   - nombre del negocio
   - direccion
   - slug publico
   - WhatsApp principal
   - WhatsApp de notificaciones
   - logo
   - colores de marca
5. Guardar.
6. Entrar al negocio creado.
7. Activar los modulos contratados:
   - carta digital
   - pedidos
   - pagos
   - cocina
   - delivery
   - reservas
   - promociones
8. Verificar que el link publico funcione.

Ejemplo de link:

```txt
https://simi-peru.vercel.app/menu/pollo-loco
```

## 4. Configuracion basica antes de vender

Antes de compartir el QR o el link, revisar:

1. Logo del negocio.
2. Banner o imagen principal.
3. Colores de marca.
4. WhatsApp de atencion.
5. WhatsApp de notificaciones.
6. Horarios de atencion.
7. Metodos de pago.
8. Zonas de delivery.
9. Mesas si el negocio usara pedidos en salon.
10. Productos publicados.

No se debe compartir el QR hasta probar un pedido completo.

## 5. Registro de categorias

Las categorias ordenan la carta.

Ejemplos:

- Pollos a la brasa
- Ofertas
- Parrillas
- Bebidas
- Chifa
- Sopas
- Hamburguesas

Paso a paso:

1. Entrar al panel del negocio.
2. Ir a la configuracion de carta o productos.
3. Buscar la seccion `Categorias`.
4. Crear categoria.
5. Escribir nombre claro y corto.
6. Agregar imagen si aplica.
7. Definir si estara activa.
8. Guardar.

Buenas practicas:

- No crear demasiadas categorias si el cliente esta en celular.
- Usar nombres faciles de entender.
- Colocar primero lo mas vendido.
- Ocultar categorias vacias o inactivas.

## 6. Registro de productos

Cada producto debe tener informacion clara para que el comensal decida rapido.

Campos recomendados:

- nombre
- descripcion corta
- precio
- categoria
- imagen
- disponibilidad
- etiqueta si aplica

Ejemplo:

```txt
Nombre: 1/4 de Pollo a la Brasa
Descripcion: Acompanado con papas fritas y ensalada cocida.
Precio: S/ 16.50
Categoria: Pollos a la Brasa
Estado: Disponible
```

Paso a paso:

1. Entrar al panel del negocio.
2. Ir a carta/productos.
3. Seleccionar `Nuevo producto`.
4. Elegir categoria.
5. Escribir nombre.
6. Agregar descripcion corta.
7. Colocar precio.
8. Subir imagen liviana.
9. Revisar que el producto este disponible.
10. Guardar.
11. Abrir la carta publica y verificar que aparezca correctamente.

Buenas practicas:

- Las fotos deben ser reales o muy parecidas al producto.
- Evitar descripciones largas.
- Si el producto se agota, marcarlo como no disponible en vez de eliminarlo.
- Revisar precios antes de hora punta.
- No usar nombres internos que el cliente no entienda.

## 7. Manejo de imagenes

Las imagenes influyen mucho en la decision de compra.

Recomendaciones:

- usar fotos claras
- evitar imagenes oscuras
- no subir archivos muy pesados
- mostrar el producto completo
- evitar textos muy pequenos dentro de la imagen

Para provincia y conectividad limitada, lo ideal es usar imagenes livianas.

Peso recomendado:

```txt
Producto: menos de 500 KB
Banner: menos de 1 MB
Logo: menos de 300 KB
```

## 8. Publicacion y revision de la carta

Despues de cargar categorias y productos:

1. Abrir la carta publica.
2. Revisar en celular.
3. Revisar en laptop.
4. Probar buscador.
5. Probar botones de categoria.
6. Agregar un producto al pedido.
7. Revisar que el carrito funcione.
8. Hacer un pedido de prueba.

Si algo no se ve bien:

- revisar si el producto esta activo
- revisar si la categoria esta activa
- revisar si tiene precio
- revisar si la imagen cargo bien
- actualizar la pagina publica

## 9. Flujo de pedido del comensal

El comensal debe hacer pocos pasos.

Flujo ideal:

1. Escanea QR o entra al link.
2. Ve la carta.
3. Busca o filtra productos.
4. Agrega productos al pedido.
5. Elige modalidad:
   - mesa
   - recojo
   - delivery
6. Ingresa datos minimos.
7. Confirma pedido.
8. Realiza pago por Yape/Plin si corresponde.
9. Sube comprobante.
10. Consulta el estado del pedido.

Regla clave:

Cada campo extra puede hacer que el cliente abandone el pedido.

## 10. Atencion de pedidos en el panel

Cuando entra un pedido, el negocio debe actuar rapido.

Paso a paso:

1. El sistema muestra alerta o campana.
2. El encargado abre `Pedidos`.
3. Revisa:
   - numero de pedido
   - cliente
   - productos
   - total
   - modalidad
   - pago
   - notas
4. Si todo esta correcto, acepta el pedido.
5. Si requiere pago, valida el comprobante.
6. Envia a cocina.
7. Cocina prepara.
8. Cocina marca como listo.
9. Se entrega en mesa, recojo o delivery.
10. Se marca como entregado.

Tiempo recomendado:

```txt
Pedido nuevo: responder antes de 5 minutos
Pago enviado: validar antes de 5 minutos
Cocina lista: marcar listo de inmediato
```

## 11. Validacion de pagos

El pago puede llegar por Yape, Plin u otro metodo.

Paso a paso:

1. Entrar a `Pedidos` o `Pagos`.
2. Buscar pedidos con estado de pago pendiente o comprobante enviado.
3. Abrir detalle.
4. Revisar comprobante.
5. Comparar monto con total del pedido.
6. Si coincide, marcar pago validado.
7. Si no coincide, contactar al cliente por WhatsApp.
8. Si el comprobante es incorrecto, rechazar o mantener pendiente.

Buenas practicas:

- No enviar a cocina pedidos pagados por adelantado si el comprobante no esta validado.
- Si el cliente es frecuente y el negocio lo permite, puede avanzar manualmente bajo responsabilidad del encargado.
- Guardar evidencia del comprobante.

## 12. Flujo de cocina

Cocina debe ver solo lo que necesita preparar.

Estados recomendados:

1. Pedido confirmado.
2. En preparacion.
3. Listo.
4. Entregado o enviado.

Paso a paso:

1. Cocina entra al modulo `Cocina`.
2. Revisa pedidos nuevos enviados a cocina.
3. Marca `En preparacion`.
4. Prepara el pedido.
5. Marca `Listo`.
6. El encargado de atencion o delivery continua el flujo.

Buenas practicas:

- No mezclar pedidos pendientes de pago con pedidos listos para cocina.
- Usar notas del cliente con cuidado.
- Si falta un producto, avisar al encargado antes de preparar.

## 13. Flujo de delivery

Antes de aceptar delivery, configurar zonas.

Paso a paso para configurar:

1. Ir a `Delivery`.
2. Crear zonas.
3. Colocar costo de delivery.
4. Colocar pedido minimo si aplica.
5. Colocar tiempo estimado.
6. Registrar repartidores.

Paso a paso para atender:

1. Pedido entra como delivery.
2. Se valida pago.
3. Se envia a cocina.
4. Cocina marca listo.
5. Encargado asigna repartidor.
6. Repartidor sale.
7. Pedido se marca en camino.
8. Se confirma entrega.

Buenas practicas:

- No ofrecer zonas que el negocio no pueda cubrir.
- Informar tiempos realistas.
- Si llueve o hay alta demanda, actualizar tiempos.

## 14. Flujo de recojo en tienda

El recojo es mas simple que delivery.

Paso a paso:

1. Cliente elige recojo.
2. Ingresa nombre y telefono.
3. Confirma pedido.
4. Paga si corresponde.
5. Negocio valida pago.
6. Cocina prepara.
7. Se marca listo.
8. Cliente recoge.
9. Se marca entregado.

Buenas practicas:

- Indicar tiempo estimado.
- Pedir nombre claro.
- Confirmar por WhatsApp si hay demora.

## 15. Flujo de pedido en mesa

Este flujo sirve para locales con mesas.

Paso a paso:

1. Cliente escanea QR de la mesa.
2. Elige productos.
3. Confirma pedido.
4. El sistema registra la mesa.
5. El encargado revisa el pedido.
6. Se envia a cocina.
7. Cocina prepara.
8. Mozo entrega.
9. Se marca entregado.

Buenas practicas:

- Cada mesa debe tener su QR correcto.
- Si el negocio cobra al final, marcar pago pendiente hasta cierre.
- Si el negocio cobra antes, validar pago antes de cocina.

## 16. Gestion de reservas

Las reservas ayudan a evitar cruces de horario.

Paso a paso:

1. Cliente entra al link de reserva.
2. Selecciona fecha y hora.
3. Ingresa nombre, telefono y cantidad de personas.
4. El negocio recibe alerta.
5. El encargado revisa disponibilidad.
6. Confirma o rechaza.
7. Si confirma, prepara mesa.

Buenas practicas:

- Confirmar por WhatsApp si la reserva es grande.
- No aceptar mas reservas que mesas disponibles.
- Revisar reservas antes de iniciar el turno.

## 17. Manejo de promociones

Las promociones ayudan a empujar productos clave.

Ejemplos:

- combo familiar
- pollo + gaseosa
- delivery gratis
- descuento por horario

Paso a paso:

1. Ir a `Promociones`.
2. Crear promocion.
3. Agregar titulo claro.
4. Subir banner.
5. Elegir producto o categoria relacionada.
6. Activar boton de accion si aplica.
7. Guardar.
8. Revisar en carta publica.

Buenas practicas:

- Usar pocas promociones a la vez.
- Colocar ofertas reales.
- Evitar banners con demasiado texto.
- Tener stock suficiente.

## 18. Cierre diario recomendado

Al terminar el dia:

1. Revisar pedidos entregados.
2. Revisar pedidos cancelados.
3. Revisar pagos pendientes.
4. Revisar reservas del dia siguiente.
5. Marcar productos agotados o disponibles.
6. Actualizar precios si hubo cambios.
7. Revisar alertas o errores si los hubo.

Checklist rapido:

- no quedan pedidos nuevos sin atender
- no quedan pagos por validar
- no quedan pedidos listos sin entregar
- carta actualizada para el dia siguiente
- zonas de delivery correctas

## 19. Errores comunes y solucion

### Producto no aparece en la carta

Revisar:

- producto activo
- categoria activa
- negocio activo
- precio correcto
- guardar cambios

### Pedido no llega al panel

Revisar:

- conexion a internet
- recargar panel
- campana de alertas
- modulo pedidos activo
- revisar `/api/health` si el sistema esta lento

### Cliente no puede pagar

Revisar:

- QR de Yape/Plin visible
- numero correcto
- monto correcto
- instrucciones claras

### Cocina no ve el pedido

Revisar:

- pedido aceptado
- pago validado si corresponde
- enviado a cocina
- usuario con acceso a cocina

### Delivery no aparece

Revisar:

- zona activa
- repartidor activo
- pedido marcado como listo
- pedido tipo delivery

## 20. Reglas de atencion para no perder pedidos

1. Responder rapido.
2. No pedir datos innecesarios.
3. Mantener la carta actualizada.
4. No ofrecer productos agotados.
5. Validar pagos sin demora.
6. Marcar estados reales.
7. Usar WhatsApp solo para resolver dudas, no para reconstruir pedidos.
8. Revisar la campana de alertas durante hora punta.
9. Mantener imagenes livianas para celulares con internet lento.
10. Probar el flujo completo cada vez que se cambie algo importante.

## 21. Flujo MVP recomendado

Para lanzar rapido en un negocio nuevo:

1. Crear negocio.
2. Subir logo y colores.
3. Crear categorias principales.
4. Subir productos mas vendidos.
5. Configurar WhatsApp y Yape/Plin.
6. Configurar delivery si aplica.
7. Probar pedido interno.
8. Imprimir QR.
9. Compartir link en redes.
10. Capacitar al encargado en pedidos, pagos y cocina.

No es necesario cargar toda la carta el primer dia. Es mejor iniciar con productos clave y luego completar.

## 22. Flujo fase 2 recomendado

Cuando el negocio ya use SIMI de forma diaria:

1. Agregar reportes mas avanzados.
2. Crear app o vista dedicada para repartidor.
3. Integrar pagos automaticos.
4. Agregar fidelizacion.
5. Agregar cupones.
6. Agregar marketplace por ciudad.
7. Agregar analitica por zonas y horarios.

## 23. Resumen para capacitacion

El encargado debe dominar primero:

1. Crear y editar productos.
2. Marcar productos agotados.
3. Revisar pedidos nuevos.
4. Validar pagos.
5. Enviar pedidos a cocina.
6. Marcar pedidos listos.
7. Asignar delivery.
8. Cerrar pedidos como entregados.

Con eso el negocio ya puede operar el MVP de SIMI.
