/* GymIA — tela de login restaurada */
(function(){
  const API_URL = "https://prjacademiaia.onrender.com";

  function icon(type){
    if(type==='mail') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
    if(type==='lock') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
    if(type==='eye') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
    return '';
  }

  function showError(message){
    const error=document.getElementById('gymia-login-error');
    if(!error)return;
    error.textContent=message||'';
    error.classList.toggle('show',!!message);
  }

  async function submitLogin(email,password){
    /* Se a versão completa da autenticação estiver disponível no app.js,
       reutiliza exatamente o fluxo existente. */
    if(typeof window.loginWithEmail==='function'){
      return await window.loginWithEmail(email,password);
    }

    /* Compatibilidade com a versão atual do repositório, que ainda não
       expõe loginWithEmail no frontend. */
    const response=await fetch(`${API_URL}/auth/login`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:String(email).trim().toLowerCase(),password:String(password)})
    });
    let data=null;
    try{ data=await response.json(); }catch(_){ }
    if(!response.ok) throw new Error(data?.detail||'E-mail ou senha inválidos.');

    if(data?.access_token){
      localStorage.setItem('meuTreinoAccessToken',data.access_token);
      if(data.user) localStorage.setItem('meuTreinoUser',JSON.stringify(data.user));
    }
    return true;
  }

  function render(){
    if(document.getElementById('gymia-login')) return;

    document.body.insertAdjacentHTML('afterbegin', `
      <section id="gymia-login" class="gymia-login" aria-label="Login GymIA">
        <div class="gymia-login__screen">
          <div class="gymia-login__brand">
            <img class="gymia-login__logo" src="logo-gymia.svg" alt="GymIA">
          </div>

          <form class="gymia-login__form" id="gymia-login-form" novalidate>
            <label class="gymia-login__field">
              ${icon('mail')}
              <input id="gymia-email" type="email" autocomplete="email" placeholder="E-mail" aria-label="E-mail" required>
            </label>

            <label class="gymia-login__field">
              ${icon('lock')}
              <input id="gymia-password" type="password" autocomplete="current-password" placeholder="Senha" aria-label="Senha" required>
              <button type="button" class="gymia-login__eye" id="gymia-eye" aria-label="Mostrar senha">${icon('eye')}</button>
            </label>

            <div class="gymia-login__error" id="gymia-login-error" role="alert"></div>

            <button class="gymia-login__primary" type="submit" id="gymia-login-submit">Entrar</button>

            <button class="gymia-login__link" type="button" id="gymia-forgot">Esqueci minha senha</button>
          </form>

          <div class="gymia-login__signup">
            <span>Ainda não tem conta?</span>
            <button type="button" id="gymia-register">Criar conta</button>
          </div>
        </div>
      </section>`);

    const overlay=document.getElementById('gymia-login');
    const form=document.getElementById('gymia-login-form');
    const email=document.getElementById('gymia-email');
    const password=document.getElementById('gymia-password');
    const submit=document.getElementById('gymia-login-submit');

    document.getElementById('gymia-eye').onclick=function(){
      const visible=password.type==='text';
      password.type=visible?'password':'text';
      this.setAttribute('aria-label',visible?'Mostrar senha':'Ocultar senha');
    };

    form.addEventListener('submit',async function(e){
      e.preventDefault();
      showError('');

      const mail=email.value.trim();
      const pass=password.value;
      if(!mail || !pass){
        showError('Informe seu e-mail e sua senha.');
        return false;
      }

      submit.disabled=true;
      submit.textContent='Entrando...';

      try{
        const ok=await submitLogin(mail,pass);
        if(!ok) throw new Error('E-mail ou senha inválidos.');

        /* Na versão com autenticação integrada, renderHome() mantém o fluxo
           normal do aplicativo; caso contrário, apenas libera a aplicação. */
        overlay.hidden=true;
        if(typeof window.renderHome==='function') window.renderHome();
      }catch(err){
        showError(err?.message||'Não foi possível entrar. Tente novamente.');
        submit.disabled=false;
        submit.textContent='Entrar';
      }
      return false;
    });

    document.getElementById('gymia-forgot').onclick=function(){
      showError('A recuperação de senha será disponibilizada em uma próxima etapa.');
    };

    document.getElementById('gymia-register').onclick=function(){
      if(typeof window.toggleAuthMode==='function'){
        overlay.hidden=true;
        window.toggleAuthMode('register');
        return;
      }
      showError('O cadastro será conectado ao serviço de autenticação.');
    };

    setTimeout(()=>email.focus(),50);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',render);
  else render();
})();
