package com.dba.alld.scheduler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.TriggerContext;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.scheduling.support.CronTrigger;

import java.util.Date;

/**
 *
 * //todo:
 * run a scheduler
 * 1. check if expiry date < current date , if yes make status = inactive
 * 2. update if member is voter as per rule
 * Member who completed 2 year (GM voter/ LM voter)
 * GM -> COP(mandate) + fee paid(mandate)staus + 2 year (case of blank consider 2 year)
 * LM -> COP only
 * */

@Configuration
public class DynamicSchedulerConfig implements SchedulingConfigurer {

    @Autowired
    private SchedulerProperties schedulerProperties;

    @Autowired
    private MemberSchedulerService service;

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {

        taskRegistrar.addTriggerTask(

                // Task to run
                () -> {
                    if (schedulerProperties.isEnabled()) {
                        System.out.println("Running scheduler at " + new Date());
                        service.runDailyMaintenance();
                    } else {
                        System.out.println("Scheduler disabled");
                    }
                },

                // Trigger (correct parameter type)
                (TriggerContext triggerContext) -> {

                    if (!schedulerProperties.isEnabled()) {
                        return null; // stop scheduling
                    }

                    String cron = schedulerProperties.getCron();

                    return new CronTrigger(cron).nextExecution(triggerContext);
                }
        );
    }

}

