import { sessionService } from '../services/sessionService';

// eslint-disable-next-line react-hooks/rules-of-hooks, no-undef
useEffect(() => {
	// eslint-disable-next-line no-undef
	const found = formService.getForm(formId);
	// eslint-disable-next-line no-undef
	setForm(found);
	if (found) {
		// Запросить имя клиента
		// eslint-disable-next-line no-undef
		let clientName = localStorage.getItem(`clientName_${formId}`);
		if (!clientName) {
			clientName = prompt('Введите ваше имя:');
			// eslint-disable-next-line no-undef
			if (clientName) localStorage.setItem(`clientName_${formId}`, clientName);
			else clientName = 'Аноним';
		}
		// Создаём сессию
		const newSession = sessionService.createSession(
			clientName,
			found.id,
			found.title,
			found.psychologistId,
		);
		// eslint-disable-next-line no-undef
		setSessionId(newSession.id);
	}
	// eslint-disable-next-line no-undef
}, [formId]);
