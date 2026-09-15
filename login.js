/* GymIA — camada visual de login. A autenticação real pode ser conectada depois ao backend. */
(function(){
  function icon(type){
    if(type==='mail') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
    if(type==='lock') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
  }
  function render(){
    if(document.getElementById('gymia-login')) return;
    document.body.insertAdjacentHTML('afterbegin', `
      <section id="gymia-login" class="gymia-login" aria-label="Login GymIA">
        <div class="gymia-login__screen">
          <div class="gymia-login__brand">
            <img class="gymia-login__logo" src="logo-gymia.svg" alt="GymIA">
            <h1 class="gymia-login__name">GymIA</h1>
            <p class="gymia-login__tagline">INTELIGÊNCIA PARA O SEU TREINO</p>
          </div>
          <form class="gymia-login__form" id="gymia-login-form" novalidate>
            <label class="gymia-login__field">${icon('mail')}<input id="gymia-email" type="email" autocomplete="email" placeholder="E-mail" aria-label="E-mail" required></label>
            <label class="gymia-login__field">${icon('lock')}<input id="gymia-password" type="password" autocomplete="current-password" placeholder="Senha" aria-label="Senha" required><button type="button" class="gymia-login__eye" id="gymia-eye" aria-label="Mostrar senha">${icon('eye')}</button></label>
            <div class="gymia-login__error" id="gymia-login-error"></div>
            <button class="gymia-login__primary" type="submit">Entrar</button>
            <button class="gymia-login__link" type="button" id="gymia-forgot">Esqueceu sua senha?</button>
            <div class="gymia-login__or">ou</div>
            <button class="gymia-login__secondary" type="button" id="gymia-register">Criar conta</button>
          </form>
          <p class="gymia-login__footer">Disciplina hoje,<br>resultados sempre.</p>
        </div>
      </section>`);

    const overlay=document.getElementById('gymia-login');
    const form=document.getElementById('gymia-login-form');
    const email=document.getElementById('gymia-email');
    const password=document.getElementById('gymia-password');
    const error=document.getElementById('gymia-login-error');
    document.getElementById('gymia-eye').onclick=function(){ password.type=password.type==='password'?'text':'password'; };
    form.addEventListener('submit', function(e){
      e.preventDefault();
      error.classList.remove('show');
      if(!email.value.trim() || !password.value.trim()){
        error.textContent='Informe seu e-mail e sua senha.';
        error.classList.add('show');
        return;
      }
      // Até a autenticação do backend ser conectada, o botão libera o aplicativo.
      overlay.hidden=true;
    });
    document.getElementById('gymia-forgot').onclick=function(){
      error.textContent='A recuperação de senha será conectada ao serviço de autenticação.';
      error.classList.add('show');
    };
    document.getElementById('gymia-register').onclick=function(){
      error.textContent='O cadastro será conectado ao serviço de autenticação.';
      error.classList.add('show');
    };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',render); else render();
})();
