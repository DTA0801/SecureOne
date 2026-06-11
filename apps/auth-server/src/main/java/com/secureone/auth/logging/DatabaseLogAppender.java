package com.secureone.auth.logging;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;

/** Persists structured log lines (with session/request MDC) to PostgreSQL. */
public class DatabaseLogAppender extends AppenderBase<ILoggingEvent> {

    @Override
    protected void append(ILoggingEvent event) {
        if (event.getLoggerName().startsWith("com.secureone.auth.logging")) {
            return;
        }
        boolean secureOne = event.getLoggerName().startsWith("com.secureone");
        if (secureOne) {
            if (!event.getLevel().isGreaterOrEqual(Level.INFO)) {
                return;
            }
        } else if (!event.getLevel().isGreaterOrEqual(Level.WARN)) {
            return;
        }
        ApplicationLogWriter writer = ApplicationLogWriter.getInstance();
        if (writer != null) {
            writer.append(event);
        }
    }
}
