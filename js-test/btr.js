/**
 * New node file  t
 */
(
		function(a){
			function b(a,b){
				if(+a)
					return~a||(d.cookie=h+"=; path=/");
				j=d.createElement(e),k=d.getElementsByTagName(e)[0],j.src=a,b&&(j.onload=j.onerror=b),k.parentNode.insertBefore(j,k)
			}
			function c(){
				n.api||b(l.shift()||-1,c)
			}
			if(this.Mobify)
				return;
			var d=document,e="script",f="mobify",g="."+f+".com/",h=f+"-path",i=g+"un"+f+".js",j,k,l=[!1,1],
			m,n=this.Mobify={points:[+(new Date)],tagVersion:[6,1]},
			o=/((; )|#|&|^)mobify-path=([^&;]*)/g.exec(location.hash+"; "+d.cookie);
			o?(m=o[3])&&!+(m=o[2]&&sessionStorage[h]||m)&&(l=[!0,"//preview"+g+escape(m)]):(l=a()||l,l[0]&&l.push("//cdn"+i,"//files01"+i)),
					l.shift()?(d.write('<plaintext style="display:none;">'),setTimeout(c)):b(l[0])
		}
)
(
					function(){
						if(/ip(hone|od|ad)|android|blackberry.*applewebkit/i.test(navigator.userAgent)){
							return[1,"//cdn.mobify.com/sites/beyond-the-rack/beyond-the-rack-qa01/mobify.js?v=2"]
						}
						return[0,"//cdn.mobify.com/sites/beyond-the-rack/beyond-the-rack-qa01/a.js"]
					}
		)