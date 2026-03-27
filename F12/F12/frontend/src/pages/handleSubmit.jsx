import { sessionService } from '../services/sessionService';

function handleSubmit(e) {
	e.preventDefault();
	// Сохраняем ответы в localStorage для демонстрации
	const allAnswers = {
		formId,
		submittedAt: new Date().toISOString(),
		answers,
	};
	const saved = JSON.parse(localStorage.getItem('form_responses') || '[]');
	saved.push(allAnswers);
	localStorage.setItem('form_responses', JSON.stringify(saved));
	alert('Спасибо! Ваши ответы сохранены.');
	setSubmitted(true);
}
function handleSubmit(e) {
	e.preventDefault();
	sessionService.completeSession(sessionId, answers);
	// ... остальное
	if (!form)
		return (
			<div className='container' style={{ marginTop: '3rem' }}>
				Форма не найдена
			</div>
		);

	if (submitted)
		return (
			<div
				className='container'
				style={{ marginTop: '3rem', textAlign: 'center' }}
			>
				<div className='card'>
					<h2>Спасибо за участие в опросе!</h2>
					<p>Ваши ответы успешно отправлены.</p>
				</div>
			</div>
		);

	return (
		<div className='container' style={{ maxWidth: '700px', marginTop: '3rem' }}>
			<div className='card'>
				<h1 style={{ marginBottom: '1rem' }}>{form.title}</h1>
				<form onSubmit={handleSubmit}>
					{form.questions.map((q, idx) => (
						<div key={idx} className='form-group'>
							<label>{q.questionText}</label>
							{q.type === 'text' && (
								<input
									type='text'
									value={answers[idx]}
									onChange={e => handleAnswerChange(idx, e.target.value)}
									required
								/>
							)}
							{q.type === 'radio' && (
								<div style={{ display: 'flex', gap: '1rem' }}>
									<label>
										<input
											type='radio'
											name={`q${idx}`}
											value='Да'
											onChange={() => handleAnswerChange(idx, 'Да')}
										/>{' '}
										Да
									</label>
									<label>
										<input
											type='radio'
											name={`q${idx}`}
											value='Нет'
											onChange={() => handleAnswerChange(idx, 'Нет')}
										/>{' '}
										Нет
									</label>
								</div>
							)}
						</div>
					))}
					<button type='submit' className='btn btn-primary'>
						Отправить
					</button>
				</form>
			</div>
		</div>
	);
}
