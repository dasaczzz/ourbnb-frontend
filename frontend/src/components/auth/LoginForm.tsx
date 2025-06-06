import { useForm } from '../../hooks/useForm'
import { FaEye, FaEyeSlash } from 'react-icons/fa6'
import { Button } from '../primitives/Button'
import { Input } from '../primitives/Input'
import { AppDispatch } from '../../store/store'
import { useDispatch } from 'react-redux'
import { startLogin } from '../../store/thunks/authThunk'
import { Link, useNavigate } from 'react-router-dom'

export const LoginForm = () => {

  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const {email, login_password, form, handleInputChange, handleReset, showPassword, handleToggleShow, errors, validateForm} = useForm({email: '', login_password: ''})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const result = await dispatch(startLogin(form))
    if (result) navigate('/')
    handleReset()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="login-form">
      <Input text='Correo electrónico' error={errors.email} onChange={handleInputChange} placeholder='ejemplo@mail.com' name='email' value={email} type='text' data-testid="email-input"/>
      <div className='flex justify-between items-center gap-3'>
        <Input type={showPassword ? 'text' : 'password'} text='Contraseña' error={errors.login_password} onChange={handleInputChange} placeholder='Tu contraseña' name='login_password' value={login_password} data-testid="password-input"/>
        <button type='button' onClick={handleToggleShow} data-testid="toggle-password-visibility">{showPassword ? <FaEyeSlash size={24}/> : <FaEye size={24}/>}</button>
      </div>
      <Button intent='primary' type='submit' data-testid="login-button">Entrar</Button>
      <div className='flex items-center'>
        <p className='mr-2'>También puedes:</p>
        <Link to={'/'}>
        <Button intent='secondary' data-testid="guest-login-button">Entrar como invitado</Button>
        </Link>
      </div>
    </form>
  )
}
