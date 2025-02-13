sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("pecogaapsolicitudes.controller.Main", {
        formatFechaUTC: function(fecha) {
        
            // Crear un array con los nombres cortos de los meses en español
            const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        
            // Obtener los componentes de la fecha en UTC
            const dia = fecha.getUTCDate();
            const mes = meses[fecha.getUTCMonth()];
            const anio = fecha.getUTCFullYear();
        
            // Formatear la fecha al formato deseado
            return `${dia} ${mes} ${anio}`;
        },
        formatMoney: function (value) {
            if (value == null || isNaN(value)) {
                return ""; // Manejo de valores nulos o inválidos
            }
        
            // Formatear el número con coma como separador de miles y punto para decimales
            return new Intl.NumberFormat("en-US", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        },
        onAfterRendering: function () {
            // Obtener la referencia de la lista
            const oList = this.byId("list");
            var that = this;
            // Esperar a que los datos se carguen
            oList.attachEventOnce("updateFinished", () => {
                // Obtener los elementos de la lista
                const aItems = oList.getItems();

                // Verificar que haya elementos en la lista
                if (aItems.length > 0) {
                    // Seleccionar el primer elemento
                    //oList.setSelectedItem(aItems[0]);
                    oList.getItems()[0].firePress()
                    that.extHookOnInit();
                }
            });
        },
        setUrlBase: function(url){
			sessionStorage.setItem("urlBase", url);
		},
        getUrlBase: function () {
			var remoto = sessionStorage.getItem("urlBase");
			return remoto;
		},
        
        onInit: function(){
            const orderRoute = this.getOwnerComponent().getRouter().getRoute("RouteMain");
            orderRoute.attachPatternMatched(this.onPatternMatched, this);
            
            // SER URL BASE
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.setUrlBase(this.oRouter._oOwner._oManifest._oBaseUri._parts.path)
        },
        onPatternMatched: function(){
            
            this.setFooter();
            var userapi = new sap.ui.model.json.JSONModel();
		    userapi.loadData(this.getUrlBase() + "user-api/attributes", "", false);
            
        },
        fnAprobarTodos: function (oEvent) {
            console.log("CFV fnAprobarTodos");
            var oList;
            var aSelectedItems;
            var aItemsAprobar = [];
            var sAprobarTodos;
            oList = this.getView().byId("list");
            aSelectedItems = oList.getSelectedItems();
    
            if (aSelectedItems.length < 1) {
                sap.m.MessageToast.show("Seleccione como mínimo un item");
            } else {
                aSelectedItems.forEach(function (x) {
                    aItemsAprobar.push({
                        PrNumber: x.getBindingContext().getObject().PrNumber,
                        ItemNumber: x.getBindingContext().getObject().ItemNumber
                    });
                });
                sap.ui.core.BusyIndicator.show(0);
        
                /* Llamamos RFC */
                sAprobarTodos = this.sAprobarTodos(aItemsAprobar);
                
                sAprobarTodos.success(function (x) {
                    sap.ui.core.BusyIndicator.hide();
                    debugger;
                    console.log("Respuesta del servidor antes de parsear:", x);

                    console.log("Tipo de x:", typeof x);
                    console.log("Contenido de x:", x);
        
                    var oModel = new sap.ui.model.json.JSONModel();
                    var oResponse = [];
        
                    if (typeof x === "string") {
                        var parser = new DOMParser();
                        x = parser.parseFromString(x, "application/xml");
                    }
        
                    // 🟢 Extraer datos manualmente del XML
                    var items = x.getElementsByTagName("item");
                    for (var i = 0; i < items.length; i++) {
                        var ebeln = items[i].getElementsByTagName("Ebeln")[0]?.textContent || "";
                        var type = items[i].getElementsByTagName("Type")[0]?.textContent || "";
                        var msg = items[i].getElementsByTagName("Msg")[0]?.textContent || "";
        
                        oResponse.push({ Ebeln: ebeln, Type: type, Msg: msg });
                    }
        
                    console.log("Datos extraídos:", oResponse);
        
                    oModel.setData(oResponse);
                    this.getView().setModel(oModel, "detalleEjecucion");
        
                    this._getDialog().open();
                }.bind(this));
        
                sAprobarTodos.fail(function (x) {
                    sap.ui.core.BusyIndicator.hide();
                    console.log(x);
                });
            }
    
            //this.setMargenBoton();
        },
    
        fnRechazarTodos: function (oEvent) {
            console.log("CFV fnRechazarTodos");
            var oList;
            var aSelectedItems;
            var aItemsAprobar = [];
            var sRechazarTodos;
            oList = this.getView().byId("list");
            aSelectedItems = oList.getSelectedItems();
    
            if (aSelectedItems.length < 1) {
                sap.m.MessageToast.show("Seleccione como mínimo un item");
            } else {
                aSelectedItems.forEach(function (x) {
                    //	aItemsAprobar.push(x.getBindingContext().getObject().PrNumber);
                    //  Ajuste Gian Carlo Vera 
                    aItemsAprobar.push(x.getBindingContext().getProperty(x.getBindingContext.sPath));
                });
    
                sap.ui.core.BusyIndicator.show(0);
        
                /* Llamamos RFC */
                sRechazarTodos = this.sRechazarTodos(aItemsAprobar);
                
                sRechazarTodos.success(function (x) {
                    sap.ui.core.BusyIndicator.hide();
                    debugger;
                    console.log("Respuesta del servidor antes de parsear:", x);

                    console.log("Tipo de x:", typeof x);
                    console.log("Contenido de x:", x);
        
                    var oModel = new sap.ui.model.json.JSONModel();
                    var oResponse = [];
        
                    if (typeof x === "string") {
                        var parser = new DOMParser();
                        x = parser.parseFromString(x, "application/xml");
                    }
        
                    // 🟢 Extraer datos manualmente del XML
                    var items = x.getElementsByTagName("item");
                    for (var i = 0; i < items.length; i++) {
                        var ebeln = items[i].getElementsByTagName("Ebeln")[0]?.textContent || "";
                        var type = items[i].getElementsByTagName("Type")[0]?.textContent || "";
                        var msg = items[i].getElementsByTagName("Msg")[0]?.textContent || "";
        
                        oResponse.push({ Ebeln: ebeln, Type: type, Msg: msg });
                    }
        
                    console.log("Datos extraídos:", oResponse);
        
                    oModel.setData(oResponse);
                    this.getView().setModel(oModel, "detalleEjecucion");
        
                    this._getDialog().open();
                }.bind(this));
        
                sRechazarTodos.fail(function (x) {
                    sap.ui.core.BusyIndicator.hide();
                    console.log(x);
                });
            }
            //this.setMargenBoton();
        },
    
        onCloseFilterOptionsDialogConfirm: function () {
            console.log("CFV onCloseFilterOptionsDialogConfirm");
            var oList = this.getView().byId("list");
            $.selectedItems = [];
            this.getView().getModel().refresh();
            //this.getOwnerComponent().getRouter().navTo("noData");
            oList.removeSelections();
            this._getDialog().close();
    
            //this.setMargenBoton();
        },
    
        _getDialog: function () {
            console.log("CFV _getDialog");
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("pecogaapsolicitudes.fragment.view.Resume", this);
                this.getView().addDependent(this._oDialog);
            }
    
            //this.setMargenBoton();
    
            return this._oDialog;
        },
        
        _getZeros: function (x) {
            var zero = "";
            for (var i = 0; i < (10 - x.length); i++) {
                zero += "0";
            }
            return zero;
            console.log(zero);
        },
        /*sAprobarTodos: function (aItems) {
            var data =
                '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:soap:functions:mc-style">\
       <soapenv:Header/>\
       <soapenv:Body>\
          <urn:ZmmPoRelm>\
             <ItDocin>';
    
            aItems.forEach(function (x) {
                data += '<item>' +
                    '<Ebeln>' + this._getZeros(x.PrNumber) + x.PrNumber + '</Ebeln>' +
                    '<Rejec></Rejec>' +
                    '</item>';
            }.bind(this));
    
            data += '</ItDocin>\
          </urn:ZmmPoRelm>\
       </soapenv:Body>\
    </soapenv:Envelope>';
    
            var url = "/coga/sap/bc/srt/rfc/sap/zmm_rq_relm/600/zmm_rq_relm/zmm_rq_relm";
    
            return jQuery.ajax({
                url: url,
                type: "POST",
                dataType: "xml",
                context: this,
                data: data,
                contentType: 'text/xml; charset=\"utf-8\"'
            });
    
            //console.log(data);
    
        },*/
    
        sRechazarTodos: function (aItems) {
            var data =
                '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:soap:functions:mc-style">\
       <soapenv:Header/>\
       <soapenv:Body>\
          <urn:ZmmPoRelm>\
             <ItDocin>';
    
            aItems.forEach(function (x) {
                data += '<item>' +
                    '<Ebeln>' + this._getZeros(x) + x + '</Ebeln>' +
                    '<Rejec>X</Rejec>' +
                    '</item>';
            }.bind(this));
    
            data += '</ItDocin>\
          </urn:ZmmPoRelm>\
       </soapenv:Body>\
    </soapenv:Envelope>';
    
            var url = this.getUrlBase() + "ODATA_FIORI_GATEWAY/sap/bc/srt/rfc/sap/zmm_po_relm/600/zmm_po_relm/zmm_po_relm";
    
            return jQuery.ajax({
                url: url,
                type: "POST",
                dataType: "xml",
                context: this,
                data: data,
                contentType: 'text/xml; charset=\"utf-8\"'
            });
    
            //console.log(data);
    
        },
    
        
        sAprobarTodos: function (aItems) {
            console.log("CFV sAprobarTodos");
            var data =
                '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:soap:functions:mc-style">\
       <soapenv:Header/>\
       <soapenv:Body>\
          <urn:ZmmRqRelm>\
             <ItDocin>';
    
            aItems.forEach(function (x) {
                data += '<item>' +
                    '<Banfn>' + x.PrNumber + '</Banfn>' +
                    '<Bnfpo>00000</Bnfpo>' +
                    //'<Bnfpo>00000</Bnfpo>' +
                    '<Rejec></Rejec>' +
                    '</item>';
            
            }.bind(this));
    
            data += '</ItDocin>\
          </urn:ZmmRqRelm>\
       </soapenv:Body>\
    </soapenv:Envelope>';
    
            var url = this.getUrlBase() + "ODATA_FIORI_GATEWAY/sap/bc/srt/rfc/sap/zmm_rq_relm/600/zmm_rq_relm/zmm_rq_relm";
    
            return jQuery.ajax({
                url: url,
                type: "POST",
                dataType: "xml",
                context: this,
                data: data,
                contentType: 'text/xml; charset=\"utf-8\"'
            });
    
            //console.log(data);
            //this.setMargenBoton();
    
        },
    
        /*sRechazarTodos: function (aItems) {
            console.log("CFV sRechazarTodos");
            var data =
                '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:soap:functions:mc-style">\
                <soapenv:Header/>\
                <soapenv:Body>\
                <urn:ZmmRqRelm>\
                <ItDocin>';
    
            aItems.forEach(function (x) {
                data += '<item>' +
                    '<Banfn>' + x.PrNumber + '</Banfn>' +
                    '<Bnfpo>' + x.ItemNumber + '</Bnfpo>' +
                    '<Rejec>X</Rejec>' +
                    '</item>';
            });
    
            data += '</ItDocin>\
          </urn:ZmmRqRelm>\
       </soapenv:Body>\
    </soapenv:Envelope>';
    
            var url = "/coga/sap/bc/srt/rfc/sap/zmm_rq_relm/600/zmm_rq_relm/zmm_rq_relm";
    
            return jQuery.ajax({
                url: url,
                type: "POST",
                dataType: "xml",
                context: this,
                data: data,
                contentType: 'text/xml; charset=\"utf-8\"'
            });
    
            //console.log(data);
            //this.setMargenBoton();
        },*/
    
        /*
            sRechazarTodos: function (aItems) {
            console.log("CFV sRechazarTodos");
            var data =
                '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:soap:functions:mc-style">\
                <soapenv:Header/>\
                <soapenv:Body>\
                <urn:ZmmPoRelm>\
                <ItDocin>';
    
                aItems.forEach(function (x) {
                        data += '<item>' +
                            '<Banfn>' + x.PrNumber + '</Banfn>' +
                            '<Bnfpo>' + x.ItemNumber + '</Bnfpo>' +
                            '<Rejec>X</Rejec>' +
                            '</item>';
            });
    
                    data += '</ItDocin>\
                  </urn:ZmmPoRelm>\
               </soapenv:Body>\
            </soapenv:Envelope>';
    
            var url = "/coga/sap/bc/srt/rfc/sap/zmm_rq_relm/600/zmm_rq_relm/zmm_rq_relm";
    
            return jQuery.ajax({
                url: url,
                type: "POST",
                dataType: "xml",
                context: this,
                data: data,
                contentType: 'text/xml; charset=\"utf-8\"'
            });
    
            //console.log(data);
            //this.setMargenBoton();
        }, */
    
        // urn:ZmmRqRelm
    
        getListItems: function (oList) {
            console.log("CFV getListItems");
            var aItems = oList.getItems();
            var aVisibleItems = [];
            aItems.forEach(function (x) {
                if (x.getVisible()) {
                    aVisibleItems.push(x);
                }
            }.bind(this));
            //this.setMargenBoton();
    
            return aVisibleItems;
        },
    
        fnSelectAll: function (e) {
            console.log("CFV fnSelectAll");
            var oList = this.getView().byId("list");
            var aSelectedItems = oList.getSelectedItems();
            var aItems = this.getListItems(oList); //oList.getItems();
    
            $.ListPO.detachSelect(this._handleSelectPress, this);
            if (aSelectedItems.length === aItems.length) {
                oList.removeSelections();
            } else {
                aItems.forEach(function (x) {
                    x.setSelected(true);
                });
            }
            $.ListPO.attachSelect(this._handleSelectPress, this);
            console.log("--fnSelectAll--");
            //this.setMargenBoton();
        },
    
        setFooter: function () {
            var page = this.getView().getContent()[0];
            if (!page) return;
        
            page = page.getAggregation("_navMaster")?.getAggregation("pages")[0];
            if (!page) return;
        
            var header = page.getCustomHeader();
            if (header && header.getContentRight().length < 1) {
                var oSelectAll = new sap.m.Button({
                    icon: "sap-icon://multiselect-all",
                    press: this.fnSelectAll.bind(this)
                });
                header.addContentRight(oSelectAll);
            }
        
            var bar = page.getFooter();
            if (bar && bar.getContentRight().length < 1) {
                var oAceptar = new sap.m.Button({
                    text: "Aprobar todos",
                    type: sap.m.ButtonType.Accept,
                    press: this.fnAprobarTodos.bind(this)
                });
        
                var oCancelar = new sap.m.Button({
                    text: "Rechazar todos",
                    type: sap.m.ButtonType.Reject,
                    press: this.fnRechazarTodos.bind(this)
                });
        
                bar.addContentLeft(oAceptar);
                bar.addContentRight(oCancelar);
            }
        },
    
        extHookOnInit: function () {
            console.log("CFV extHookOnInit");
    
            variable = false;
    
            $.selectedItems = [];
            this.getOwnerComponent().getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
            $.ListPO = this.getView().byId("list");
            //this.setFooter();
            //	sap.ui.core.BusyIndicator.show(0);
    
            /* cargando el usuario actual */
            //var userapi = new sap.ui.model.json.JSONModel();
            //userapi.loadData("/services/userapi/attributes", "", false);
    
            $.ListPO.attachSelect(this._handleSelectPress, this);
    
            var l = this.getList();
            l.detachEvent("updateFinished");
            l.attachEvent("updateFinished", function (e) {
                sap.ui.core.BusyIndicator.hide();
                // this.jQueryDeferred
                // 	.then(function (oRetorno) {
    
                // 		//		this.getView().getModel().setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                // 		//var modelo = this.getView().getModel();
    
                // 		this.aItems = this.getList().getItems();
                // 		this.datos = oRetorno;
    
                // 		//var data = JSON.parse(JSON.stringify(modelo.getProperty("/")));
                // 		//var model = new sap.ui.model.json.JSONModel(data);
    
                // 		for (var i = 0; i < this.aItems.length; i++) {
                // 			var find = this.datos.find(function (element) {
                // 				return "00" + this.aItems[i].getBindingContext().getObject().PrNumber === element.Ebeln;
                // 			}.bind(this));
                // 			if (find) {
                // 				if (parseFloat(find.ZvalDiff) > 0) {
                // 					var text = "Valor Anterior: " + find.ZvalAnterior;
                // 					this.getList().getItems()[i].getAggregation("attributes")[4].setText(text);
                // 					var text2 = " Diferencia: " + find.ZvalDiff;
                // 					this.getList().getItems()[i].getAggregation("attributes")[5].setText(text2);
                // 				}
                // 			}
                // 		}
                // 		sap.ui.core.BusyIndicator.hide();
                // 	}.bind(this))
                // 	.fail(function (x) {
                // 		sap.ui.core.BusyIndicator.hide();
                // 		console.log(x);
                // 	});
            }, this);
            //	console.log("--fui cargado--");
            //https://TLURSAPDE01.tgp.net:8001/sap/bc/srt/rfc/sap/zfiori_datos_adicionales_me28/600/zfiori_datos_adicionales_me28/zfiori_datos_adicionales_me28
    
            //this.setMargenBoton();
        },
    
        setListItem: function (i) {
            console.log("CFV setListItem");
            //this._clearSelection();
            //i.setSelected(true);
            this._navToListItem(i);
            //this.setMargenBoton();
        },
    
        onRouteMatched: function (e) {
            console.log("CFV onRouteMatched");
            var name = e.getParameter("name");
            var list = this.getView().byId("list");
            //$.PrNumber = list.getSelectedItem().getBindingContext().getObject().PrNumber;                         
            this.getView().getModel().attachRequestCompleted(function (x) {
                var oHashChanger = sap.ui.core.routing.HashChanger;
                if (!variable) {
                    if (list.getSelectedItem()) {
                        $.PrNumber = list.getSelectedItem().getBindingContext().getObject().PrNumber;
                        $.ItemNumber = list.getSelectedItem().getBindingContext().getObject().ItemNumber;
                        if ($.PrNumber) {
                            variable = true;
                        }
                        //variable = true;
                    }
                    oHashChanger.getInstance().replaceHash("");
                    variable = true;
                    //oHashChanger.getInstance().replaceHash("");
                    list.removeSelections();
                    //list.removeSelections();
                } else if ((name === "detail") && ($.selectedItems.length >= 0)) {
                    list.removeSelections();
                    var items = $.selectedItems;
                    items.forEach(function (x) {
                        list.setSelectedItem(x);
                    }.bind(this));
                }
            }.bind(this));
            //	console.log(e);
            //this.setMargenBoton();
        },
    
        _handleItemPressDesktop: function (oEvent) {
            debugger
            console.log("_handleItemPressDesktop");

            this.getView().setBusyIndicatorDelay(0);
            this.getView().setBusy(true);
       
            // Obtener el item correcto
            var item;
            if (oEvent.getId() === "select") {
                item = oEvent.getParameter("listItem");
                console.log("Resultado de Item de lista: ",item);
            } else {
                item = oEvent.getSource();
                console.log("Resultado de Item del contexto global: ",item);
            }
        
            // Validar que item sea un ObjectListItem antes de continuar
            console.log("Resultado de Item del contexto global: ",item instanceof sap.m.ObjectListItem);
            if (!(item instanceof sap.m.ObjectListItem)) {
                this.getView().setBusy(false);
                console.error("El evento no proviene de un ObjectListItem.");
                return;
            }
        
            var oItem = item.getBindingContext().getObject();
            console.log("Resultado de Item del contexto global oItem: ",oItem);
            if (!oItem) {
                this.getView().setBusy(false);
                console.error("No se encontró un objeto válido en el contexto.");
                return;
            }
        
            // Actualizar modelo "header"
            this.getView().setModel(new sap.ui.model.json.JSONModel(oItem), "header");

        
            
                // 🔹 CORRECCIÓN: Obtener SplitContainer dinámicamente desde la vista
                var oSplitContainer = this.getView().getParent();
                if (oSplitContainer && oSplitContainer.isA("sap.m.SplitContainer") && !sap.ui.Device.system.phone) {
                    oSplitContainer.hideMaster();
                } else {
                    console.warn("No se encontró el SplitContainer o no es válido.");
                }
        
            // Construcción de la URL para expandir datos
            var sPath = "/WorkflowTaskCollection(SAP__Origin='LOCAL',WorkitemID='" + oItem.WorkitemID + "')/HeaderDetails";
            var aExpand = ["HeaderItemDetails", "Notes", "Attachments"];
        
            console.log("ruta: ", sPath);
        
            var oModel = this.getView().getModel();
        
            // Realizar la llamada OData
            oModel.read(sPath, {
                urlParameters: {
                    "$expand": aExpand.join(',')
                },
                success: function(oData) {
                    sap.m.MessageToast.show("Datos cargados con éxito");
                    this.getView().setModel(new sap.ui.model.json.JSONModel(oData), "detail");
                    console.log("Modelo: ", oData);
                    this.getView().setBusy(false);
                }.bind(this),
                error: function(oError) {
                    this.getView().setBusy(false);
                    sap.m.MessageToast.show("Error al cargar los datos");
                    console.error(oError);
                }
            });
        },
        
        _handleItemPress: function (oEvent) {
            console.log("--_handleItemPress--");
            debugger
            var isPhone = this.getView().getModel("device").getData().isPhone;
            this.fnCargarAprobadores(oEvent);
        
            try {
                this._handleItemPressDesktop(oEvent);
            } catch (e) {
                console.error(e);
            }
        },

    
        _handleSelectPress: function (oEvent) {
            /* Is this a phone */
            debugger
            console.log("_handleSelectPress", oEvent);
            var isPhone;
            isPhone = this.getView().getModel("device").getData().isPhone;
            if (isPhone) {
                //this._handleItemPressPhone(oEvent);
            } else {
                this._handleItemPress(oEvent);
            }
        },
   
        _handleSelect: function (e) {
            //console.log(e.getSource().getSelectedItems());
            console.log("_handleSelect");
            this.setListItem(e);
            if (!sap.ui.Device.system.phone) {
                this._oApplicationImplementation.oSplitContainer.hideMaster();
            }
        },

        // fireSelectionChange: function (oEvent) {
        //     console.log("fireSelectionChange ejecutado");
            
        //     // Obtener el ítem seleccionado
        //     var oList = this.getView().byId("list");
        //     var aSelectedItems = oList.getSelectedItems(); // Obtiene todos los seleccionados
        
        //     if (aSelectedItems.length > 0) {
        //         // Pasa el primer ítem seleccionado a _handleSelectPress
        //         this._handleSelectPress(aSelectedItems[0]);
        //     }
        // },

        // fireSelectionChange: function (e) {
        //     $.selectedItems = e.getSource().getSelectedItems();
        //     console.log("fireSelectionChange");
        //     console.log("Dtao: ", $.selectedItems);
        //     this._handleSelectPress(oEvent);
        // },
   
        // fireSelectionChange: function (e) {
        //     debugger
        //     $.selectedItems = e.getSource().getSelectedItems();
        //     console.log("fireSelectionChange", $.selectedItems);
        //     console.log("Evento: ",e);
        // },

        fireSelectionChange: function (e) {
            debugger;
            console.log("fireSelectionChange ejecutado", e);
        
            var aSelectedItems = e.getSource().getSelectedItems();
            console.log("Elementos seleccionados:", aSelectedItems);
        
            if (aSelectedItems.length > 0) {
                var oLastSelectedItem = aSelectedItems[aSelectedItems.length - 1]; // Último seleccionado
                console.log("Último seleccionado:", oLastSelectedItem);
        
                var oEventMock = {
                    getId: function () { return "select"; },
                    getParameter: function () { return oLastSelectedItem; },
                    getSource: function () { return e.getSource(); }
                };
        
                this._handleSelectPress(oEventMock);
            }
        },

        // fireSelectionChange: function (e) {
        //     debugger;
        //     console.log("fireSelectionChange ejecutado", e);
        
        //     // Obtener la lista de elementos seleccionados
        //     var selectedItems = e.getSource().getSelectedItems();
        //     console.log("Elementos seleccionados:", selectedItems);
        
        //     // Si hay al menos un elemento seleccionado, construir un nuevo evento 'select'
        //     if (selectedItems.length > 0) {
        //         var fakeSelectEvent = {
        //             getId: function() { return "select"; },
        //             getParameter: function(param) {
        //                 if (param === "listItem") {
        //                     return selectedItems[0]; // Pasar el primer elemento seleccionado
        //                 }
        //             },
        //             getSource: function() {
        //                 return e.getSource();
        //             }
        //         };
        
        //         // Llamar a _handleSelectPress con el evento transformado en "select"
        //         this._handleSelectPress(fakeSelectEvent);
        //     } else {
        //         console.warn("No hay elementos seleccionados en selectionChange.");
        //     }
        // },
   
        _navToListItem: function (l) {
            this.oRouter.navTo(this.getDetailRouteName(), this.getDetailNavigationParameters(l), !sap.ui.Device.system.phone);
        },

        __handleSelect: function (oEvent) {
            this._handleSelect(oEvent);
            $.selectedItems = e.getSource().getSelectedItems();
            console.log(e.getSource().getSelectedItems());
            this.fnCargarAprobadores(oEvent);
            console.log("__handleSelect");
        },
    
        fnCargarAprobadores: function (oEvent) {
            console.log("CFV fnCargarAprobadores");
            if (oEvent.getSource().getBindingContext()) {
                $.PrNumber = oEvent.getSource().getBindingContext().getObject().PrNumber;
                $.ItemNumber = oEvent.getSource().getBindingContext().getObject().ItemNumber;
            } else {
                $.PrNumber = oEvent.getSource().getSelectedItem().getBindingContext().getObject().PrNumber;
                $.ItemNumber = oEvent.getSource().getSelectedItem().getBindingContext().getObject().ItemNumber;
            }
    
            var component = this.getOwnerComponent();
            var oEventBus = component.getEventBus();
            oEventBus.publish("s3", "e1");
            //this.setMargenBoton();
        },
    
        extHookSetHeaderFooterOptions: function (l) {
            //console.log("hago cosas");
            console.log("CFV extHookSetHeaderFooterOptions");
            //this.setMargenBoton();
            return l;
        },
    
        setMargenBoton: function () {
            console.log('MARGEN - BOTON - INICIO');
            var obButton = document.getElementsByTagName("button");
    
            for (var i = 0; i < obButton.length; i++) {
                console.log(i);
                //var titulosElts = document.getElementsByTagName("button"); 
                //console.log(titulosElts[0]); 
                console.log(obButton[i]);
                obButton[i].style.marginLeft = "18px";
                obButton[i].style.marginRight = "18px";
                //console.log(titulosElts[i].style.marginLeft);
                //console.log(titulosElts[i].style.marginRight);
            }
    
            console.log('MARGEN - BOTON - FIN');
        }
    });
});